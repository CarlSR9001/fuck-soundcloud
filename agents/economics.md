# Economics — Voluntary Contribution Model (M5)

**Purpose:** Fair, ethical economics system with voluntary contributions, user-centric distribution, charitable giving, and transparent artist payouts.

**Prerequisites:**
- Read `api-specs.md` for contribution and payout endpoints
- Read `workers.md` for distribution job implementation
- Read `security.md` for payment provider security

---

## Philosophy

**Reject extractive commerce.**

Traditional music platforms:
- Force subscriptions or ads
- Use pro-rata distribution (benefits major labels)
- 70% to rights holders (but mostly labels, not artists)
- Opaque royalty calculations

**Our model:**
- Voluntary contributions (no paywalls)
- User-centric distribution (YOUR $ → artists YOU listen to)
- 80/10/10 default split (artists/charity/platform)
- 100% transparent with full breakdown

---

## Contribution System (Humble Bundle Model)

### Core Concept

Users choose:
1. **How much to contribute** ($1 - $1000)
2. **How to split it** (tri-slider: artists / charity / platform)
3. **Which charity** to support
4. **One-time or recurring** (monthly subscription)

**Default split:** 80% artists, 10% charity, 10% platform

### UI Component

```
┌─────────────────────────────────────────┐
│ Support the Platform                    │
├─────────────────────────────────────────┤
│ Amount: $10 [slider: $1 - $1000]        │
├─────────────────────────────────────────┤
│ Split:                                  │
│ Artists   [████████] 80%                │
│ Charity   [█] 10%                       │
│ Platform  [█] 10%                       │
│ (Drag sliders to adjust)                │
├─────────────────────────────────────────┤
│ Charity: [Electronic Frontier Found. ▼] │
├─────────────────────────────────────────┤
│ ○ One-time  ● Monthly                   │
├─────────────────────────────────────────┤
│ [Contribute via Stripe]                 │
└─────────────────────────────────────────┘
```

### Validation Rules

- **Amount:** Minimum $1, maximum $1000
- **Percentages:** Must sum to 100%
- **Charity:** Must select active charity
- **Recurring:** Optional monthly auto-renewal

---

## User-Centric Distribution Model

### The Problem with Pro-Rata

**Spotify's model (pro-rata):**
1. Sum all subscription revenue (e.g., $100M)
2. Count total platform plays (e.g., 10B plays)
3. Artist earns: (their plays / total plays) × revenue pool
4. Result: $0.003 per stream, regardless of who listened

**Why it's unfair:**
- Small artists with dedicated fans earn same as artists with bot plays
- Your subscription money goes to artists you never listen to
- Labels with mass appeal dominate the pool

### Our Model (User-Centric)

**How it works:**
1. User contributes $10/month
2. Platform takes 10% ($1 for operations)
3. Charity gets 10% ($1 to selected org)
4. Artists get 80% ($8)
5. **That $8 is distributed ONLY to artists the user listened to**
6. Proportional to listening time

**Example:**
```
User's listening in October:
- Artist A: 10 hours
- Artist B: 5 hours
- Artist C: 5 hours
Total: 20 hours

Distribution of $8:
- Artist A: $4.00 (10/20 × $8)
- Artist B: $2.00 (5/20 × $8)
- Artist C: $2.00 (5/20 × $8)
```

**Benefits:**
- Fair to small artists (if 100 fans pay $10, artist gets $800)
- No benefit from fake plays (user-specific)
- Transparent (artists see exact listener count)

---

## Database Schema (M5 Tables)

### contributions

```sql
CREATE TABLE contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  amount_cents INTEGER NOT NULL,
  artist_percent INTEGER NOT NULL,
  charity_percent INTEGER NOT NULL,
  platform_percent INTEGER NOT NULL,
  charity_id UUID REFERENCES charities(id),
  recurring BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'pending', -- pending, succeeded, failed
  payment_intent_id VARCHAR(255), -- Stripe payment intent ID
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_contributions_user ON contributions(user_id);
CREATE INDEX idx_contributions_status ON contributions(status);
```

### charities

```sql
CREATE TABLE charities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  website VARCHAR(500),
  ein VARCHAR(20), -- Tax ID (501c3 verification)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Seed data:**
```sql
INSERT INTO charities (slug, name, description, website, ein, is_active) VALUES
('eff', 'Electronic Frontier Foundation', 'Defending civil liberties in the digital world', 'https://eff.org', '04-3091431', true),
('cc', 'Creative Commons', 'Free tools for sharing and collaboration', 'https://creativecommons.org', '04-3585301', true),
('ia', 'Internet Archive', 'Universal access to all knowledge', 'https://archive.org', '94-3242767', true),
('wikimedia', 'Wikimedia Foundation', 'Supporting Wikipedia and free knowledge', 'https://wikimediafoundation.org', '20-0049703', true);
```

### artist_payouts

```sql
CREATE TABLE artist_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES users(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_cents INTEGER NOT NULL,
  contribution_count INTEGER DEFAULT 0, -- Number of contributors
  listener_count INTEGER DEFAULT 0, -- Unique listeners
  listening_time_ms BIGINT DEFAULT 0, -- Total listening time
  status VARCHAR(20) DEFAULT 'pending', -- pending, paid, failed
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(artist_id, period_start, period_end)
);

CREATE INDEX idx_artist_payouts_artist ON artist_payouts(artist_id);
CREATE INDEX idx_artist_payouts_period ON artist_payouts(period_start, period_end);
```

---

## Payment Provider Abstraction

### Interface Design

**Why abstract:** Future-proof for multiple payment processors

```typescript
// api/src/payments/interfaces/payment-provider.interface.ts
export interface PaymentProvider {
  /**
   * Create one-time payment
   */
  createPayment(params: CreatePaymentParams): Promise<PaymentResult>;

  /**
   * Create recurring subscription
   */
  createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionResult>;

  /**
   * Cancel subscription
   */
  cancelSubscription(subscriptionId: string): Promise<void>;

  /**
   * Process webhook event
   */
  processWebhook(payload: any, signature: string): Promise<WebhookEvent>;
}

export interface CreatePaymentParams {
  amount_cents: number;
  user_id: string;
  metadata: {
    artist_percent: number;
    charity_percent: number;
    platform_percent: number;
    charity_id?: string;
  };
}

export interface PaymentResult {
  payment_intent_id: string;
  status: 'succeeded' | 'pending' | 'failed';
  client_secret?: string; // For frontend confirmation
}
```

### Stripe Implementation

**Default provider:** Stripe SDK v17.3.1

```typescript
// api/src/payments/providers/stripe.provider.ts
import Stripe from 'stripe';

export class StripePaymentProvider implements PaymentProvider {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });
  }

  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: params.amount_cents,
      currency: 'usd',
      metadata: {
        user_id: params.user_id,
        artist_percent: params.metadata.artist_percent.toString(),
        charity_percent: params.metadata.charity_percent.toString(),
        platform_percent: params.metadata.platform_percent.toString(),
        charity_id: params.metadata.charity_id || '',
      },
    });

    return {
      payment_intent_id: paymentIntent.id,
      status: paymentIntent.status as any,
      client_secret: paymentIntent.client_secret,
    };
  }

  async createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionResult> {
    // Create customer if not exists
    let customer = await this.findOrCreateCustomer(params.user_id);

    // Create subscription
    const subscription = await this.stripe.subscriptions.create({
      customer: customer.id,
      items: [
        {
          price_data: {
            currency: 'usd',
            product: process.env.STRIPE_PRODUCT_ID,
            unit_amount: params.amount_cents,
            recurring: { interval: 'month' },
          },
        },
      ],
      metadata: params.metadata,
    });

    return {
      subscription_id: subscription.id,
      status: subscription.status,
    };
  }

  async processWebhook(payload: any, signature: string): Promise<WebhookEvent> {
    const event = this.stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        return {
          type: 'payment.succeeded',
          data: event.data.object,
        };

      case 'payment_intent.failed':
        return {
          type: 'payment.failed',
          data: event.data.object,
        };

      case 'customer.subscription.deleted':
        return {
          type: 'subscription.cancelled',
          data: event.data.object,
        };

      default:
        return { type: 'unknown', data: null };
    }
  }
}
```

### Future Providers (Planned)

**PayPal:**
```typescript
export class PayPalPaymentProvider implements PaymentProvider {
  // Implement using PayPal REST API
}
```

**LemonSqueezy:**
```typescript
export class LemonSqueezyPaymentProvider implements PaymentProvider {
  // Implement using LemonSqueezy API
}
```

**Crypto (BTCPay):**
```typescript
export class CryptoPaymentProvider implements PaymentProvider {
  // Implement using BTCPay Server API
}
```

**Provider selection:**
```typescript
// api/src/payments/payments.service.ts
export class PaymentsService {
  private provider: PaymentProvider;

  constructor() {
    const providerType = process.env.PAYMENT_PROVIDER || 'stripe';

    switch (providerType) {
      case 'stripe':
        this.provider = new StripePaymentProvider();
        break;
      case 'paypal':
        this.provider = new PayPalPaymentProvider();
        break;
      // ... etc
    }
  }
}
```

---

## Distribution Worker Job

### Monthly Execution

**Cron schedule:** 1st day of month at 2 AM UTC

```typescript
// api/src/scheduler/distribution.scheduler.ts
import { Cron } from '@nestjs/schedule';

export class DistributionScheduler {
  @Cron('0 2 1 * *') // Run monthly
  async scheduleDistribution() {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const period_start = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
    const period_end = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);

    await this.distributionQueue.add('distribute', {
      period_start,
      period_end,
    });
  }
}
```

### Distribution Algorithm

**Implementation:** See `workers.md` for full code

**High-level flow:**
1. Query all successful contributions for period
2. Group by user_id
3. Calculate each user's artist pool (contribution × artist_percent)
4. For each user:
   - Query their listening time per artist
   - Distribute pool proportionally
   - Create/update ArtistPayout records
5. Sum charity contributions
6. Update charity totals

**Example calculation:**
```typescript
// User contributed $50, 80% to artists = $40 pool
// User listened to:
//   Artist A: 10 hours
//   Artist B: 5 hours
//   Total: 15 hours

// Artist A gets: ($40 × 10/15) = $26.67
// Artist B gets: ($40 × 5/15) = $13.33
```

---

## Artist Payout Dashboard

### Data Display

**Artist view (`/dashboard/payouts`):**
```
┌─────────────────────────────────────────────┐
│ Your Earnings - October 2025               │
├─────────────────────────────────────────────┤
│ Total: $142.35                              │
│ From 23 contributors                        │
│ 47 unique listeners                         │
│ 182 hours listened                          │
├─────────────────────────────────────────────┤
│ Breakdown:                                  │
│ User-centric distribution: $142.35          │
│ (Your actual fans' contributions)           │
├─────────────────────────────────────────────┤
│ Top contributors:                           │
│ 1. @fan123 - $25.00 (40h listened)          │
│ 2. @superfan - $18.50 (28h listened)        │
│ 3. @listener - $12.00 (15h listened)        │
├─────────────────────────────────────────────┤
│ Payment status: Pending (processes 5th)     │
└─────────────────────────────────────────────┘
```

**Transparency benefits:**
- Artists see exactly who supports them
- Can thank top supporters
- Understand their true fanbase
- No mystery algorithms

---

## User Impact Dashboard

### Contribution History

**User view (`/dashboard/impact`):**
```
┌─────────────────────────────────────────────┐
│ Your Impact - Lifetime                      │
├─────────────────────────────────────────────┤
│ Total contributed: $120.00                  │
│ Artists supported: 15                       │
│ To charities: $12.00                        │
├─────────────────────────────────────────────┤
│ Where your money went:                      │
│ 🎵 Artists: $96.00 (80%)                    │
│ 💚 Charities: $12.00 (10%)                  │
│ 🖥️ Platform: $12.00 (10%)                   │
├─────────────────────────────────────────────┤
│ Top artists you supported:                  │
│ 1. Artist A - $24.00 (48h listened)         │
│ 2. Artist B - $18.00 (36h listened)         │
│ 3. Artist C - $12.00 (24h listened)         │
├─────────────────────────────────────────────┤
│ Charities you supported:                    │
│ • EFF: $8.00                                │
│ • Creative Commons: $4.00                   │
└─────────────────────────────────────────────┘
```

---

## No Paywalls

**Critical principle:** All music streams freely, always.

### What's Free

- **All track streams** (HLS playback)
- **All waveforms and comments**
- **All profiles and discovery**
- **All embeds**

### Optional Artist Settings

**Downloads:**
```typescript
interface TrackDownloadPolicy {
  enabled: boolean;
  formats: ('original' | 'mp3_320' | 'stems')[];
  require_contribution: boolean; // Artist choice
}
```

**Example:**
- Track A: Downloads free for everyone
- Track B: Downloads free only for contributors (artist choice)
- Track C: Downloads disabled entirely

**Stems access:**
```typescript
interface StemAccessPolicy {
  enabled: boolean;
  require_contribution: boolean; // Artist choice
}
```

**Philosophy:** Artists control their content, but default is open access.

---

## Charity Integration

### Vetting Process

**Criteria for inclusion:**
- 501(c)(3) tax-exempt status (US) or equivalent
- Public financials available
- Mission aligned with platform values (open culture, digital rights, education)
- No political campaigns or religious organizations

**Verification:**
```typescript
interface Charity {
  ein: string; // Tax ID for verification
  is_active: boolean; // Can be disabled if fails audit
  verified_at: Date; // When last verified
}
```

### Seed Charities (Default List)

1. **Electronic Frontier Foundation (EFF)**
   - Mission: Digital rights, privacy, free expression
   - EIN: 04-3091431

2. **Creative Commons**
   - Mission: Free culture, open licensing
   - EIN: 04-3585301

3. **Internet Archive**
   - Mission: Universal access to knowledge
   - EIN: 94-3242767

4. **Wikimedia Foundation**
   - Mission: Free educational content
   - EIN: 20-0049703

### Charity Payout Process

**Monthly distribution:**
1. Sum all charity contributions for period
2. Group by charity_id
3. Process payouts (via Stripe Connect or wire transfer)
4. Update charity totals
5. Public transparency report

**Transparency:**
```
October 2025 Charity Report:
- Total to charities: $1,234.56
- EFF: $567.89 (from 142 contributors)
- Creative Commons: $345.67 (from 89 contributors)
- Internet Archive: $234.56 (from 67 contributors)
- Wikimedia: $86.44 (from 23 contributors)
```

---

## Configuration

### Economics Config

**File:** `web/config/economics.ts`

```typescript
export const ECONOMICS_CONFIG = {
  contribution: {
    min_cents: 100, // $1 minimum
    max_cents: 100000, // $1000 maximum
    default_cents: 1000, // $10 default
    currency: 'usd',
  },

  defaultSplits: {
    artists: 80,
    charity: 10,
    platform: 10,
  },

  distribution: {
    model: 'user-centric', // vs 'pro-rata'
    period: 'monthly',
    payout_day: 5, // Process payouts on 5th of month
  },

  features: {
    recurring_enabled: true,
    charity_required: false, // Can contribute with 0% to charity
    allow_custom_splits: true,
  },
};
```

### Environment Variables

```bash
# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRODUCT_ID=prod_... # For recurring subscriptions

# Economics
PAYMENT_PROVIDER=stripe # stripe|paypal|lemon|crypto
MIN_CONTRIBUTION_CENTS=100
MAX_CONTRIBUTION_CENTS=100000
DEFAULT_ARTIST_PERCENT=80
DEFAULT_CHARITY_PERCENT=10
DEFAULT_PLATFORM_PERCENT=10

# Payout
PAYOUT_DAY=5 # Day of month to process payouts
PAYOUT_MINIMUM_CENTS=1000 # Min $10 to trigger payout
```

---

## Analytics & Reporting

### Track Economics Impact

**Queries to implement:**

**Total contributed to artist:**
```sql
SELECT SUM(ap.total_cents) as total_earned
FROM artist_payouts ap
WHERE ap.artist_id = $1 AND ap.status = 'paid';
```

**Average per contributor:**
```sql
SELECT AVG(ap.total_cents / ap.contribution_count) as avg_per_contributor
FROM artist_payouts ap
WHERE ap.artist_id = $1;
```

**Top supporters:**
```sql
SELECT u.handle, SUM(c.amount_cents * c.artist_percent / 100) as contributed
FROM contributions c
JOIN analytics_play ap ON ap.user_id = c.user_id
JOIN tracks t ON t.id = ap.track_id
JOIN users u ON u.id = c.user_id
WHERE t.owner_user_id = $1
GROUP BY u.id
ORDER BY contributed DESC
LIMIT 10;
```

---

## Legal & Tax Considerations

### 1099 Reporting (US Artists)

**If artist earns > $600/year:**
- Platform must issue 1099-K form
- Collect W-9 from artist
- Report to IRS

**Implementation:**
```typescript
interface ArtistTaxInfo {
  user_id: string;
  legal_name: string;
  ssn_last4: string; // Store encrypted
  address: string;
  w9_submitted: boolean;
  w9_submitted_at: Date;
}
```

### Platform Fees (10%)

**What it covers:**
- Server hosting (VPS, bandwidth)
- Object storage (MinIO or S3)
- Payment processing fees (Stripe: 2.9% + $0.30)
- Development and maintenance
- Support and moderation

**Transparency:** Publish monthly cost breakdown

---

## Ethical Considerations

### Why Voluntary?

**Traditional model problems:**
- Forces users to pay even if they can't afford it
- Ads exploit user attention and privacy
- Creates two-tier system (premium vs free)

**Voluntary model benefits:**
- Accessible to everyone (no paywalls)
- Those who can contribute do
- Direct artist support (not ads or labels)
- Community-driven sustainability

### Fair Pricing

**$1 - $1000 range:**
- $1: Minimum for payment processing viability
- $10: Suggested amount (Netflix-equivalent)
- $1000: Max to prevent money laundering

**No pressure tactics:**
- No "upgrade to premium" popups
- No limited skips or quality restrictions
- Contribution page accessible, not intrusive

---

## Future Enhancements

**Planned features:**

1. **Artist tipping:**
   - One-time tips on track page
   - "Buy me a coffee" style micro-contributions

2. **Membership tiers:**
   - Artists set up tiers (e.g., $5/mo, $10/mo, $25/mo)
   - Perks: early access, exclusive tracks, Discord access

3. **Crowdfunding:**
   - Artists set funding goals for albums/projects
   - Backers get exclusive rewards

4. **Gift subscriptions:**
   - Buy contribution subscription for someone else

5. **Matching donations:**
   - Platform matches contributions during special events

6. **Crypto payments:**
   - Bitcoin, Ethereum, stablecoins via BTCPay
   - No middleman, lower fees

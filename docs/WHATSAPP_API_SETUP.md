# WhatsApp Business API Setup Guide

## 📱 **Complete Guide to Getting WhatsApp API Credentials**

---

## **Option 1: Meta WhatsApp Business API (Official - Recommended)**

### **✅ Pros:**
- Official Meta/Facebook solution
- Most reliable and feature-rich
- Free tier available (1,000 conversations/month)
- Full webhook support
- Message templates
- Rich media support

### **❌ Cons:**
- Requires business verification
- Setup can take 1-3 days for approval
- More complex initial setup

### **📋 Step-by-Step Setup:**

#### **Step 1: Create Meta Business Account**

1. Go to [Meta Business Suite](https://business.facebook.com/)
2. Click "Create Account"
3. Fill in your business details:
   - Business Name: "Fabric Speaks"
   - Your Name
   - Business Email

#### **Step 2: Set Up WhatsApp Business Account**

1. In Meta Business Suite, go to **Settings** → **Accounts** → **WhatsApp Accounts**
2. Click **Add** → **Create a WhatsApp Business Account**
3. Enter your business details:
   - Display Name: "Fabric Speaks"
   - Category: "Shopping & Retail" or "Apparel & Clothing"
   - Description: "Premium fabric and clothing retailer"
   - Website: Your website URL

#### **Step 3: Add Phone Number**

1. Go to **WhatsApp Manager** → **Phone Numbers**
2. Click **Add Phone Number**
3. Choose one of these options:

   **Option A: Use Your Existing Business Number**
   - Enter your business WhatsApp number
   - Verify via SMS/Call
   - ⚠️ **Important**: This number will be converted to Business API (can't use regular WhatsApp anymore)

   **Option B: Get a New Number (Recommended)**
   - Purchase a new number from a provider like:
     - Twilio
     - MessageBird
     - Your local telecom provider
   - Add this number to WhatsApp Business API

#### **Step 4: Get API Credentials**

1. In WhatsApp Manager, go to **API Setup**
2. You'll see:
   - **Phone Number ID**: Copy this (e.g., `110123456789012`)
   - **WhatsApp Business Account ID**: Copy this
   - **Access Token**: Click "Generate" or use existing

3. **Generate Permanent Access Token**:
   - Go to **System Users** in Meta Business Settings
   - Create a new system user (e.g., "Fabric Speaks API")
   - Assign WhatsApp permissions:
     - `whatsapp_business_management`
     - `whatsapp_business_messaging`
   - Generate token → **Copy and save securely**

#### **Step 5: Configure in Your App**

Add to your `.env` file:

```bash
# WhatsApp Business API
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_API_KEY=EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # Your Access Token
WHATSAPP_PHONE_NUMBER_ID=110123456789012  # Your Phone Number ID
```

#### **Step 6: Test the Integration**

1. In your admin panel, go to **Notifications** → **Recipients**
2. Add a test recipient with your personal WhatsApp number
3. Click **Send Test**
4. You should receive a test message!

---

## **Option 2: Third-Party Providers (Easier Setup)**

If Meta's process seems complex, use these providers that offer simplified WhatsApp Business API access:

### **A. Twilio (Recommended for Beginners)**

**Pros:**
- Very easy setup (15 minutes)
- Great documentation
- Free trial credits
- Reliable infrastructure

**Setup:**

1. Go to [Twilio WhatsApp](https://www.twilio.com/whatsapp)
2. Sign up for account
3. Get WhatsApp Sandbox credentials (instant)
4. For production:
   - Request WhatsApp Business Profile
   - Verify business
   - Get approved (1-2 days)

**Pricing:**
- $0.005 per message (India)
- Free trial: $15 credit

**Configuration:**
```bash
WHATSAPP_API_URL=https://api.twilio.com/2010-04-01
WHATSAPP_API_KEY=your_twilio_auth_token
WHATSAPP_PHONE_NUMBER_ID=whatsapp:+14155238886  # Twilio number
```

### **B. MessageBird**

**Pros:**
- Competitive pricing
- Good for international messaging
- Easy integration

**Setup:**

1. Go to [MessageBird](https://messagebird.com/)
2. Sign up and verify account
3. Add WhatsApp channel
4. Get API key from dashboard

**Pricing:**
- €0.0042 per message (India)
- Free trial available

### **C. Gupshup**

**Pros:**
- Popular in India
- Good local support
- Competitive pricing

**Setup:**

1. Go to [Gupshup](https://www.gupshup.io/)
2. Sign up for WhatsApp Business API
3. Complete KYC verification
4. Get API credentials

**Pricing:**
- ₹0.25 per message
- Volume discounts available

---

## **Option 3: Development/Testing Mode (No Setup Required)**

### **✅ Perfect for:**
- Testing the notification system
- Development environment
- Demo purposes

### **How it works:**

Your app is **already configured** to work in DEV MODE:

1. Leave WhatsApp credentials empty in `.env`
2. Notifications will be logged to console instead of sent
3. All logic works exactly the same
4. Perfect for testing before going live

**Example Console Output:**
```
[WhatsApp DEV MODE] Would send notification:
Type: order
Priority: important
To: +919876543210
Message:
🛍️🟡 [ORDER-IMPORTANT] New Order Placed

Order: #12345678
Customer: Rahul Sharma
Amount: ₹4,500
Items: 2
Payment: Confirmed

📍 Mumbai, Maharashtra
⏰ Just now
```

---

## **📊 Comparison Table**

| Provider | Setup Time | Cost (per msg) | Difficulty | Best For |
|----------|-----------|----------------|------------|----------|
| **Meta Direct** | 1-3 days | Free (1K/mo) | Medium | Production, High Volume |
| **Twilio** | 15 mins | $0.005 | Easy | Quick Start, Testing |
| **MessageBird** | 30 mins | €0.0042 | Easy | International |
| **Gupshup** | 1 day | ₹0.25 | Medium | India-focused |
| **DEV MODE** | 0 mins | Free | Very Easy | Development |

---

## **🎯 Recommended Approach**

### **For Immediate Testing (Today):**
1. Use **DEV MODE** (no setup required)
2. Test all notification flows
3. Verify UI works correctly
4. Check notification categorization

### **For Production (This Week):**

**If you want the easiest path:**
1. Sign up for **Twilio** (15 minutes)
2. Use sandbox for testing
3. Request production access
4. Go live in 2-3 days

**If you want the best long-term solution:**
1. Set up **Meta WhatsApp Business API**
2. Takes 1-3 days for approval
3. Free tier (1,000 messages/month)
4. Most features and reliability

---

## **🔧 Technical Implementation Details**

### **Message Format (All Providers)**

Your app sends messages in this format:

```typescript
{
  "messaging_product": "whatsapp",
  "to": "+919876543210",
  "type": "text",
  "text": {
    "body": "🛍️🟡 [ORDER-IMPORTANT] New Order Placed\n\nOrder: #12345..."
  }
}
```

### **API Endpoints**

**Meta/Facebook:**
```
POST https://graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/messages
Headers:
  Authorization: Bearer {ACCESS_TOKEN}
  Content-Type: application/json
```

**Twilio:**
```
POST https://api.twilio.com/2010-04-01/Accounts/{ACCOUNT_SID}/Messages.json
Headers:
  Authorization: Basic {BASE64(ACCOUNT_SID:AUTH_TOKEN)}
  Content-Type: application/x-www-form-urlencoded
```

### **Webhook Configuration (For Delivery Status)**

To track message delivery:

1. Set up webhook endpoint: `https://your-domain.com/api/webhooks/whatsapp`
2. Configure in provider dashboard
3. Receive delivery/read receipts
4. Update `admin_notifications` table

---

## **💡 Quick Start Checklist**

### **Phase 1: Development (Now)**
- [ ] Run database migration (`supabase db push`)
- [ ] Start server in DEV MODE
- [ ] Access admin panel `/admin/notifications`
- [ ] Add test recipient
- [ ] Send test notification
- [ ] Verify console logs show message

### **Phase 2: Testing (This Week)**
- [ ] Sign up for Twilio/Meta
- [ ] Get API credentials
- [ ] Add to `.env` file
- [ ] Restart server
- [ ] Send real WhatsApp test
- [ ] Verify message received

### **Phase 3: Production (Next Week)**
- [ ] Complete business verification
- [ ] Get production approval
- [ ] Add all team members as recipients
- [ ] Configure notification preferences
- [ ] Test all notification types
- [ ] Monitor delivery rates

---

## **🆘 Troubleshooting**

### **Issue: "WhatsApp API not configured" in logs**
**Solution**: This is normal in DEV MODE. Messages will log to console.

### **Issue: "Message not received on WhatsApp"**
**Check:**
1. Is phone number in international format? (+919876543210)
2. Is the number registered on WhatsApp?
3. Are API credentials correct in `.env`?
4. Check provider dashboard for errors

### **Issue: "Invalid phone number format"**
**Solution**: Use E.164 format: `+[country code][number]`
- India: `+919876543210`
- US: `+14155551234`

### **Issue: "Rate limit exceeded"**
**Solution**: 
- Meta: 1,000 messages/day (free tier)
- Twilio: 200 messages/day (trial)
- Upgrade plan or wait 24 hours

---

## **📞 Support Resources**

### **Meta WhatsApp Business API**
- Docs: https://developers.facebook.com/docs/whatsapp
- Support: https://business.facebook.com/business/help

### **Twilio**
- Docs: https://www.twilio.com/docs/whatsapp
- Support: https://support.twilio.com

### **Your App**
- Check server logs: `npm run dev` (server console)
- Check notification history: Admin Panel → Notifications → History
- Check stats: Admin Panel → Notifications → Statistics

---

## **🎉 You're All Set!**

Your WhatsApp notification system is **fully implemented** and ready to use!

**Next Steps:**
1. Choose your provider (or use DEV MODE for now)
2. Get credentials
3. Update `.env`
4. Start sending notifications!

**Questions?** Check the implementation guide: `docs/WHATSAPP_IMPLEMENTATION.md`

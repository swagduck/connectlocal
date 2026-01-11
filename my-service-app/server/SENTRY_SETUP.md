# Sentry Error Tracking Setup Guide

## 🚀 Quick Setup

### 1. Create Sentry Account
1. Go to [sentry.io](https://sentry.io)
2. Sign up for a free account
3. Create a new organization
4. Create a new project

### 2. Get Your DSN
- In your Sentry project, go to **Settings > Client Keys (DSN)**
- Copy your **DSN** value

### 3. Configure Environment Variables
Add your Sentry DSN to your `.env` file:

```bash
# Sentry Configuration
SENTRY_DSN=https://your-dsn-here@sentry.io/project-id
SENTRY_ENABLE_IN_DEV=false  # Set to true to test in development
```

### 4. Restart Your Server
```bash
npm start
```

## 📊 What Sentry Tracks

### Automatic Error Tracking
- **Uncaught Exceptions** - All unhandled errors
- **Unhandled Promise Rejections** - Async errors
- **HTTP Request Errors** - Failed API calls
- **Database Connection Errors** - MongoDB issues
- **Authentication Failures** - Login/registration errors

### Performance Monitoring
- **Request Duration** - API response times
- **Database Query Performance** - Slow queries
- **External API Calls** - Third-party service performance
- **Memory Usage** - Application memory profiling

### Security Events
- **Security Violations** - Suspicious activities
- **Failed Login Attempts** - Brute force attempts
- **Rate Limit Violations** - DDoS protection triggers
- **Authentication Failures** - Invalid credentials

## 🔧 Configuration Options

### Environment Variables
```bash
# Sentry DSN (required for production)
SENTRY_DSN=https://your-dsn-here@sentry.io/project-id

# Enable Sentry in development (optional)
SENTRY_ENABLE_IN_DEV=true

# Sampling rate for performance monitoring (0.0 to 1.0)
# Default: 0.1 (10%) in production, 1.0 (100%) in development
SENTRY_TRACES_SAMPLE_RATE=0.1

# Sampling rate for profiling (0.0 to 1.0)
# Default: 0.1 (10%) in production, 1.0 (100%) in development
SENTRY_PROFILES_SAMPLE_RATE=0.1
```

### Custom Error Context
Sentry automatically includes:
- **User Information** (ID, IP address)
- **Request Details** (URL, method, headers, body)
- **System Information** (Node.js version, platform)
- **Custom Tags** (service, version, environment)

## 🎯 Best Practices

### 1. Production Setup
```bash
# .env for production
NODE_ENV=production
SENTRY_DSN=https://your-production-dsn@sentry.io/project-id
SENTRY_TRACES_SAMPLE_RATE=0.1  # Sample 10% of transactions
SENTRY_PROFILES_SAMPLE_RATE=0.05  # Sample 5% for profiling
```

### 2. Development Setup
```bash
# .env for development
NODE_ENV=development
SENTRY_DSN=https://your-dev-dsn@sentry.io/project-id
SENTRY_ENABLE_IN_DEV=true
SENTRY_TRACES_SAMPLE_RATE=1.0  # Sample all transactions for testing
```

### 3. Error Filtering
Sentry automatically filters:
- **Sensitive Headers** (Authorization, Cookie)
- **Email Addresses** (hashed for privacy)
- **Password Fields** (completely filtered)
- **PII Data** (personally identifiable information)

## 📈 Monitoring Dashboard

### Key Metrics to Watch
1. **Error Rate** - Percentage of failed requests
2. **Performance** - Response time trends
3. **User Impact** - Number of affected users
4. **Release Health** - Error rates by deployment

### Alerting Setup
1. Go to **Settings > Alerts**
2. Configure alerts for:
   - **Error Rate Spikes** - Sudden increases in errors
   - **Performance Degradation** - Slow response times
   - **New Issues** - First-time errors
   - **Regressions** - Previously fixed errors reappearing

## 🛠️ Advanced Features

### 1. Custom Events
```javascript
const { captureMessage, captureError } = require('./src/config/sentry');

// Send custom message
captureMessage('Custom business event occurred', 'info', {
  tags: { feature: 'booking' },
  extra: { bookingId: '12345' }
});

// Send custom error
captureError(new Error('Custom business logic error'), {
  tags: { component: 'payment' },
  extra: { transactionId: 'abc123' }
});
```

### 2. Performance Transactions
```javascript
const { startTransaction } = require('./src/config/sentry');

const transaction = startTransaction('custom-operation', 'http.server');

// Add spans for sub-operations
const span = transaction.startChild({
  op: 'database.query',
  description: 'Find user by email'
});

// ... perform operation

span.finish();
transaction.finish();
```

### 3. User Context
```javascript
// Set user context
Sentry.setUser({
  id: 'user123',
  email: 'user@example.com',
  ip_address: '192.168.1.1'
});

// Clear user context on logout
Sentry.setUser(null);
```

## 🔍 Debugging Tips

### 1. Test Sentry Integration
```javascript
// Add this route to test Sentry
app.get('/test-sentry', (req, res) => {
  throw new Error('Test error for Sentry');
});
```

### 2. Verify Data Transmission
- Check browser network tab for Sentry requests
- Verify DSN is correctly configured
- Check console for Sentry initialization messages

### 3. Common Issues
- **CORS Errors** - Ensure Sentry domain is whitelisted
- **Missing Events** - Check sampling rates
- **Filtering Issues** - Review beforeSend configuration

## 📱 Mobile Integration

For React Native app, add:
```bash
npm install @sentry/react-native
```

And configure in your mobile app with the same DSN.

## 🎉 Success Indicators

✅ **Sentry initialized successfully** message in console  
✅ **Test errors appear** in Sentry dashboard  
✅ **Performance data** being collected  
✅ **Security events** being tracked  
✅ **Alerts configured** for critical issues  

---

**Need Help?**
- [Sentry Documentation](https://docs.sentry.io/)
- [Node.js Integration Guide](https://docs.sentry.io/platforms/node/)
- [Performance Monitoring](https://docs.sentry.io/platforms/node/performance/)

# Farcaster Mini App Deployment Guide

## Overview
This guide walks you through publishing your Lucidly Mini App on Farcaster.

## Prerequisites
- A domain name (e.g., `lucidly.yourdomain.com`)
- The domain must be accessible via HTTPS
- A Farcaster account for verification

## Step 1: Domain Setup

1. **Choose your domain**: Select a stable domain for your Mini App
   - Example: `lucidly.yourdomain.com`
   - This domain cannot be changed later
   - Must be accessible via HTTPS

2. **Deploy your Next.js app** to your chosen domain
   - Ensure the app is accessible at `https://yourdomain.com`
   - The Farcaster page should be at `https://yourdomain.com/farcaster`

## Step 2: Update Manifest Configuration

1. **Edit `public/.well-known/farcaster.json`**:
   - Replace all instances of `yourdomain.com` with your actual domain
   - Update image URLs to point to your actual assets

2. **Required assets to create**:
   - `logo.png` (1024x1024px PNG)
   - `screenshot1.png`, `screenshot2.png`, `screenshot3.png` (1284x2778px portrait)
   - `hero.png` (1200x630px)
   - `og-image.png` (1200x630px)

## Step 3: Asset Creation

### Logo (1024x1024px PNG)
- Create a square logo representing Lucidly
- No transparency/alpha channel
- Should be recognizable at small sizes

### Screenshots (1284x2778px portrait)
- Take 3 screenshots of your app in action
- Show key features like yield opportunities, portfolio, etc.
- Use a mobile device or browser dev tools to capture

### Hero Image (1200x630px)
- Promotional image for app store
- Should showcase your app's value proposition
- 1.91:1 aspect ratio

### Open Graph Image (1200x630px)
- Image shown when shared on social media
- Should include your app name and tagline

## Step 4: Verify Manifest

1. **Test your manifest**:
   ```bash
   curl https://yourdomain.com/.well-known/farcaster.json
   ```

2. **Validate JSON structure**:
   - Ensure all required fields are present
   - Check that URLs are accessible
   - Verify image dimensions match requirements

## Step 5: Account Verification

1. **Visit Farcaster Developer Tools**:
   - Go to: https://farcaster.xyz/~/developers/mini-apps/manifest

2. **Create hosted manifest**:
   - Enter your domain
   - Fill in all required information
   - Upload your assets
   - Generate account association

3. **Update your manifest**:
   - Copy the generated `accountAssociation` object
   - Add it to your `farcaster.json` file

## Step 6: Testing

1. **Test in development**:
   ```bash
   npm run dev
   ```
   - Visit `http://localhost:3000/farcaster`
   - Test Mini App functionality

2. **Test on production**:
   - Visit your deployed domain
   - Test all Mini App features
   - Verify SDK integration works

## Step 7: Publishing

1. **Deploy to production**:
   ```bash
   npm run build
   npm run start
   ```

2. **Verify manifest is accessible**:
   - `https://yourdomain.com/.well-known/farcaster.json`
   - Should return valid JSON

3. **Submit for review** (if required):
   - Some clients may require manual review
   - Contact Farcaster team if needed

## Step 8: Post-Launch

1. **Monitor usage**:
   - Track Mini App usage metrics
   - Monitor for any issues

2. **Update content**:
   - Keep yield opportunities current
   - Update screenshots as needed

3. **Engage with users**:
   - Respond to feedback
   - Improve based on usage patterns

## Troubleshooting

### Common Issues

1. **Manifest not found**:
   - Ensure `.well-known/farcaster.json` is accessible
   - Check server configuration allows access

2. **Images not loading**:
   - Verify image URLs are correct
   - Check image dimensions match requirements
   - Ensure images are accessible via HTTPS

3. **SDK not working**:
   - Check browser console for errors
   - Verify SDK is properly imported
   - Test in Mini App environment

### Support Resources

- [Farcaster Mini Apps Documentation](https://docs.farcaster.xyz/mini-apps)
- [Farcaster Developer Tools](https://farcaster.xyz/~/developers)
- [Mini App SDK Documentation](https://docs.farcaster.xyz/mini-apps/sdk)

## Security Considerations

1. **HTTPS Required**: All URLs must use HTTPS
2. **Domain Verification**: Only verified domains can publish Mini Apps
3. **Content Guidelines**: Follow Farcaster's content policies
4. **User Privacy**: Respect user data and privacy

## Next Steps

After successful deployment:

1. **Promote your Mini App**:
   - Share on Farcaster
   - Create promotional content
   - Engage with the community

2. **Iterate and improve**:
   - Gather user feedback
   - Add new features
   - Optimize performance

3. **Scale your app**:
   - Add more yield opportunities
   - Integrate additional chains
   - Expand functionality

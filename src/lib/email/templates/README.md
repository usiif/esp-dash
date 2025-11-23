# Email Templates

This directory contains all email templates for the application. Templates are organized as reusable JavaScript functions that generate HTML and plain text versions of emails.

## Architecture

The email template system follows industry best practices:

1. **Separation of Concerns**: Templates are separated from business logic
2. **Reusable Components**: Common elements (buttons, headers, etc.) are in `base.js`
3. **Type Safety**: JSDoc comments provide autocomplete and type checking
4. **No Dependencies**: Pure JavaScript, no external libraries needed
5. **Responsive Design**: Table-based layout works across all email clients

## File Structure

```
email/
├── templates/
│   ├── base.js              # Reusable components (layout, buttons, etc.)
│   ├── class-booking.js     # Class booking confirmation template
│   ├── index.js             # Export all templates
│   └── README.md            # This file
└── email.js                 # Email sending utilities (parent dir)
```

## Creating a New Template

### 1. Create Template File

Create a new file in `src/lib/email/templates/` (e.g., `welcome.js`):

```javascript
import { baseLayout, header, footer, button, paragraph } from './base.js';

/**
 * Welcome email template
 * @param {object} data - Email data
 * @param {string} data.name - User's name
 * @param {string} data.dashboardUrl - Dashboard URL
 * @returns {object} { subject, text, html }
 */
export function welcomeTemplate(data) {
  const { name, dashboardUrl } = data;

  const subject = `Welcome to Expat Spanish Lessons, ${name}!`;

  const text = `
Hi ${name},

Welcome to Expat Spanish Lessons!

Get started: ${dashboardUrl}

Saludos,
The Expat Spanish Team
  `.trim();

  const bodyContent = `
<tr>
  <td style="padding: 32px;">
    ${paragraph(`Hi ${name},`)}
    ${paragraph('Welcome to Expat Spanish Lessons!')}
    ${button(dashboardUrl, 'Get Started')}
  </td>
</tr>
  `.trim();

  const html = baseLayout(
    header('Welcome!') + '\n' + bodyContent + '\n' + footer(),
    { preheader: 'Welcome to Expat Spanish Lessons!' }
  );

  return { subject, text, html };
}
```

### 2. Export from Index

Add to `src/lib/email/templates/index.js`:

```javascript
export { welcomeTemplate } from './welcome.js';
```

### 3. Create Sender Function

Add to `src/lib/email.js`:

```javascript
export async function sendWelcomeEmail(options) {
  const { userEmail, ...templateData } = options;
  const { welcomeTemplate } = await import('./email/templates/index.js');
  const { subject, text, html } = welcomeTemplate(templateData);
  return await sendEmail(userEmail, subject, text, html);
}
```

### 4. Use in Your Code

```javascript
import { sendWelcomeEmail } from '$lib/email.js';

await sendWelcomeEmail({
  userEmail: 'student@example.com',
  name: 'Maria',
  dashboardUrl: 'https://my.expatspanishlessons.com/dashboard'
});
```

## Available Components (base.js)

### Layout & Structure

- **`baseLayout(content, options)`** - Main email wrapper
  - `content`: HTML content (usually header + body + footer)
  - `options.preheader`: Preview text shown in email clients

- **`header(title)`** - Email header with title
- **`footer(message)`** - Email footer with custom message

### Content Components

- **`paragraph(text, styles)`** - Paragraph with optional custom styles
- **`caption(text, styles)`** - Small text / caption
- **`button(href, text, color)`** - Primary CTA button
- **`link(href, text, styles)`** - Inline link
- **`infoBox(content, color, borderColor, textColor)`** - Highlighted callout box
- **`detailsTable(items)`** - Key-value table
  - `items`: Array of `{ label, value }` objects

### Example Usage

```javascript
import { paragraph, button, detailsTable } from './base.js';

// Paragraph
paragraph('Hello there!')

// Button
button('https://example.com', 'Click Me', '#f97316')

// Details table
detailsTable([
  { label: 'Name', value: 'Maria' },
  { label: 'Level', value: 'Intermediate' }
])
```

## Email Client Compatibility

Templates use table-based layouts and inline CSS for maximum compatibility:

- ✅ Gmail (Web, iOS, Android)
- ✅ Outlook (Windows, Mac, Web)
- ✅ Apple Mail (macOS, iOS)
- ✅ Yahoo Mail
- ✅ ProtonMail
- ✅ Other modern email clients

## Testing Emails

### Development Testing

```javascript
// In your route/API endpoint
if (import.meta.env.DEV) {
  console.log('Email preview:', { subject, text, html });
}
```

### Manual Testing

1. Send test email to yourself
2. Check rendering in multiple email clients
3. Verify all links work
4. Test calendar attachments (Google Calendar, iCal)

## Best Practices

1. **Always provide both HTML and text versions**
2. **Keep emails under 102KB** (Gmail clips larger emails)
3. **Use inline CSS** (external stylesheets don't work)
4. **Test on mobile** (50%+ of emails opened on mobile)
5. **Include clear CTAs** (Call-to-Action buttons)
6. **Add preheader text** (improves open rates)
7. **Use semantic HTML** (improves accessibility)

## Common Patterns

### Multiple CTAs

```javascript
${button(primaryUrl, 'Primary Action')}
${paragraph(`Or ${link(secondaryUrl, 'view in browser')} instead.`)}
```

### Conditional Content

```javascript
${data.hasDiscount ? infoBox('🎉 Special discount applied!') : ''}
```

### Lists

```javascript
${paragraph(`
  Here's what's next:<br>
  • Step 1: Do this<br>
  • Step 2: Do that<br>
  • Step 3: Finish
`)}
```

## Need Help?

- Review existing templates for examples
- Check `base.js` for available components
- Follow the pattern: `{ subject, text, html }`
- Keep templates focused (one template = one email type)

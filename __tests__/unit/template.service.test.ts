import { describe, it, expect } from 'vitest';
import { renderEmailTemplate } from '../../src/lib/template.service';

describe('renderEmailTemplate', () => {
  it('should render verify-otp template wrapped in base layout', async () => {
    const html = await renderEmailTemplate({
      templateName: 'verify-otp',
      data: {
        name: 'John Doe',
        otp: '123456',
        expiresInMinutes: 10,
      },
      title: 'Verify Your Email Address',
      previewText: 'Your OTP is 123456',
    });

    expect(html).toContain('123456');
    expect(html).toContain('John Doe');
    expect(html).toContain('Verify Your Email Address');
  });

  it('should render welcome template wrapped in base layout', async () => {
    const html = await renderEmailTemplate({
      templateName: 'welcome',
      data: {
        name: 'Jane Doe',
      },
      title: 'Welcome to my-app!',
      previewText: 'Account activated',
    });

    expect(html).toContain('Jane Doe');
    expect(html).toContain('Welcome to');
  });
});

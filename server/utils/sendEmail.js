export const sendEmailJS = async ({ to_email, to_name, reset_link }) => {
    const serviceId = process.env.EMAILJS_SERVICE_ID || 'service_xptdo89';
    const templateId = process.env.EMAILJS_RESET_TEMPLATE_ID || 'template_reset'; // User needs to set this
    const publicKey = process.env.EMAILJS_PUBLIC_KEY || 'FGdpdlZ02HmY4dEEl';
    const privateKey = process.env.EMAILJS_PRIVATE_KEY; // Must be provided in .env

    if (!privateKey) {
        console.error('EmailJS Private Key is missing from .env');
        throw new Error('Email configuration error');
    }

    const payload = {
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        accessToken: privateKey,
        template_params: {
            to_email,
            to_name,
            reset_link
        }
    };

    try {
        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`EmailJS Error: ${errText}`);
        }

        return true;
    } catch (error) {
        console.error('Failed to send email:', error);
        throw error;
    }
};

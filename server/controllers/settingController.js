import Setting from '../model/Setting.js';

// @desc    Get system settings
// @route   GET /api/settings
// @access  Public (or Authenticated Users)
export const getSettings = async (req, res) => {
    try {
        let settings = await Setting.findOne();
        
        // Create default settings if none exist
        if (!settings) {
            settings = await Setting.create({});
        }
        
        res.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ message: 'Server error fetching settings' });
    }
};

// @desc    Update system settings
// @route   PUT /api/settings
// @access  Private (Admin)
export const updateSettings = async (req, res) => {
    try {
        const { 
            storeName, 
            storeAddress, 
            storePhone, 
            storeEmail, 
            currencySymbol, 
            defaultTaxRate, 
            receiptMessage 
        } = req.body;

        let settings = await Setting.findOne();

        if (settings) {
            settings.storeName = storeName !== undefined ? storeName : settings.storeName;
            settings.storeAddress = storeAddress !== undefined ? storeAddress : settings.storeAddress;
            settings.storePhone = storePhone !== undefined ? storePhone : settings.storePhone;
            settings.storeEmail = storeEmail !== undefined ? storeEmail : settings.storeEmail;
            settings.currencySymbol = currencySymbol !== undefined ? currencySymbol : settings.currencySymbol;
            settings.defaultTaxRate = defaultTaxRate !== undefined ? defaultTaxRate : settings.defaultTaxRate;
            settings.receiptMessage = receiptMessage !== undefined ? receiptMessage : settings.receiptMessage;

            const updatedSettings = await settings.save();
            res.json(updatedSettings);
        } else {
            // Create if it somehow doesn't exist
            const newSettings = await Setting.create(req.body);
            res.status(201).json(newSettings);
        }
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ message: 'Server error updating settings' });
    }
};

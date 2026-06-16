import Customer from '../model/Customer.js';

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private (Admin/Manager)
export const getCustomers = async (req, res) => {
    try {
        const { search } = req.query;
        let query = {};
        
        if (search) {
            query = {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { phone: { $regex: search, $options: 'i' } }
                ]
            };
        }

        const customers = await Customer.find(query).sort({ createdAt: -1 });
        res.json(customers);
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ message: 'Server error fetching customers' });
    }
};

// @desc    Create a new customer
// @route   POST /api/customers
// @access  Private (Admin/Manager/Cashier)
export const createCustomer = async (req, res) => {
    try {
        const { name, email, phone, address } = req.body;

        // Check if customer exists by phone
        const customerExists = await Customer.findOne({ phone });
        if (customerExists) {
            return res.status(400).json({ message: 'Customer with this phone number already exists' });
        }

        const customer = new Customer({
            name,
            email,
            phone,
            address,
            loyaltyPoints: 0
        });

        const createdCustomer = await customer.save();
        res.status(201).json(createdCustomer);
    } catch (error) {
        console.error('Error creating customer:', error);
        res.status(500).json({ message: 'Server error creating customer' });
    }
};

// @desc    Update a customer
// @route   PUT /api/customers/:id
// @access  Private (Admin/Manager)
export const updateCustomer = async (req, res) => {
    try {
        const { name, email, phone, address, loyaltyPoints } = req.body;
        const customer = await Customer.findById(req.params.id);

        if (customer) {
            customer.name = name || customer.name;
            customer.email = email !== undefined ? email : customer.email;
            customer.phone = phone || customer.phone;
            customer.address = address !== undefined ? address : customer.address;
            
            if (loyaltyPoints !== undefined) {
                customer.loyaltyPoints = loyaltyPoints;
            }

            const updatedCustomer = await customer.save();
            res.json(updatedCustomer);
        } else {
            res.status(404).json({ message: 'Customer not found' });
        }
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({ message: 'Server error updating customer' });
    }
};

// @desc    Delete a customer
// @route   DELETE /api/customers/:id
// @access  Private (Admin/Manager)
export const deleteCustomer = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);

        if (customer) {
            await customer.deleteOne();
            res.json({ message: 'Customer removed' });
        } else {
            res.status(404).json({ message: 'Customer not found' });
        }
    } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({ message: 'Server error deleting customer' });
    }
};

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import Sale from './model/Sale.js';
import Payment from './model/Payment.js';

dotenv.config();

const migrate = async () => {
    try {
        await connectDB();
        console.log("Starting Payment Migration...");

        // Find all sales that need to be migrated
        const sales = await Sale.find({});
        console.log(`Found ${sales.length} total sales in the database.`);

        let updatedCount = 0;

        for (const sale of sales) {
            // Only update if they are currently 0 or missing
            if (!sale.cashAmount && !sale.cardAmount) {
                
                // Find payments for this specific sale
                const payments = await Payment.find({ sale: sale._id });
                
                let cash = 0;
                let card = 0;

                for (const p of payments) {
                    // Calculate the actual amount applied to the sale (amount paid minus any change given)
                    const actualPaid = p.amount - (p.change || 0);

                    if (p.paymentMethod === 'Cash') {
                        cash += actualPaid;
                    } else if (p.paymentMethod === 'Card') {
                        card += actualPaid;
                    }
                }

                // If payments were found, update the sale document
                if (cash > 0 || card > 0) {
                    sale.cashAmount = cash;
                    sale.cardAmount = card;
                    await sale.save();
                    updatedCount++;
                } else if (payments.length === 0 && sale.total > 0) {
                    // Fallback: If no payment record exists for some reason, we assume it was Cash
                    // to ensure it shows up in the dashboard totals
                    sale.cashAmount = sale.total;
                    sale.cardAmount = 0;
                    await sale.save();
                    updatedCount++;
                }
            }
        }

        console.log(`\n================================`);
        console.log(`Migration completed successfully!`);
        console.log(`Updated ${updatedCount} old sales.`);
        console.log(`================================\n`);
        
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
};

migrate();

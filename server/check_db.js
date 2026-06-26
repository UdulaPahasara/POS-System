import mongoose from 'mongoose';

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/pos-system');
  const Product = mongoose.model('Product', new mongoose.Schema({ name: String, branchData: Array }, { strict: false }));
  const products = await Product.find({name: { $in: ['TV', 'fish-bun', 'multi-plug'] }});
  console.log(JSON.stringify(products, null, 2));
  process.exit(0);
}
run();

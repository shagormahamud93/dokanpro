import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../src/config/db.js";
import { User } from "../src/modules/users/user.model.js";
import { Product } from "../src/modules/products/product.model.js";
import { Customer } from "../src/modules/customers/customer.model.js";
import { Order } from "../src/modules/orders/order.model.js";
import { Shop } from "../src/modules/shops/shop.model.js";
import { Subscription } from "../src/modules/subscriptions/subscription.model.js";
import { PLANS } from "../src/modules/subscriptions/plans.js";

const sampleProducts = [
  {
    name: "Basmati Rice",
    nameBn: "বাসমতি চাল",
    sku: "RC-BAS-5",
    barcode: "8901234567890",
    category: "Grocery",
    price: 850,
    cost: 720,
    stock: 24,
    unit: "kg",
  },
  {
    name: "Sunflower Oil",
    nameBn: "সানফ্লাওয়ার তেল",
    sku: "OIL-SF-2",
    barcode: "8901234567891",
    category: "Grocery",
    price: 420,
    cost: 360,
    stock: 12,
    unit: "ltr",
  },
  {
    name: "Red Lentil",
    nameBn: "মসুর ডাল",
    sku: "PUL-RED-1",
    barcode: "8901234567892",
    category: "Grocery",
    price: 145,
    cost: 120,
    stock: 38,
    unit: "kg",
  },
  {
    name: "Sugar",
    nameBn: "চিনি",
    sku: "SUG-WHT-1",
    barcode: "8901234567893",
    category: "Grocery",
    price: 130,
    cost: 105,
    stock: 6,
    unit: "kg",
  },
  {
    name: "Coca-Cola 1.5L",
    nameBn: "কোকা কোলা",
    sku: "BEV-COKE-15",
    barcode: "8901234567894",
    category: "Beverage",
    price: 95,
    cost: 75,
    stock: 42,
    unit: "pcs",
  },
  {
    name: "Pran Mango Juice",
    nameBn: "প্রাণ ম্যাঙ্গো জুস",
    sku: "BEV-PRAN-1",
    barcode: "8901234567895",
    category: "Beverage",
    price: 60,
    cost: 45,
    stock: 28,
    unit: "pcs",
  },
  {
    name: "Lays Classic",
    nameBn: "লেইস চিপস",
    sku: "SNK-LAY-50",
    barcode: "8901234567896",
    category: "Snacks",
    price: 50,
    cost: 35,
    stock: 60,
    unit: "pcs",
  },
  {
    name: "Dairy Milk",
    nameBn: "ডেইরি মিল্ক",
    sku: "CHO-DM-40",
    barcode: "8901234567897",
    category: "Snacks",
    price: 80,
    cost: 60,
    stock: 4,
    unit: "pcs",
  },
  {
    name: "Eggs (Tray)",
    nameBn: "ডিম",
    sku: "EGG-TR-30",
    barcode: "8901234567898",
    category: "Dairy",
    price: 380,
    cost: 320,
    stock: 8,
    unit: "dz",
  },
  {
    name: "Milk Pack",
    nameBn: "দুধ",
    sku: "MLK-PCK-1",
    barcode: "8901234567899",
    category: "Dairy",
    price: 95,
    cost: 78,
    stock: 22,
    unit: "ltr",
  },
  {
    name: "Toilet Soap",
    nameBn: "সাবান",
    sku: "PER-SOP-1",
    barcode: "8901234567900",
    category: "Personal",
    price: 65,
    cost: 48,
    stock: 35,
    unit: "pcs",
  },
  {
    name: "Toothpaste",
    nameBn: "টুথপেস্ট",
    sku: "PER-TP-1",
    barcode: "8901234567901",
    category: "Personal",
    price: 145,
    cost: 110,
    stock: 18,
    unit: "pcs",
  },
];

const sampleCustomers = [
  {
    name: "Karim Mia",
    phone: "+8801712345678",
    email: "karim@example.com",
    address: "Dhanmondi, Dhaka",
  },
  {
    name: "Rahima Khatun",
    phone: "+8801812345678",
    address: "Mohammadpur, Dhaka",
  },
  { name: "Salim Hossain", phone: "+8801912345678", due: 1200 },
];

async function run() {
  await connectDB();

  console.log("[seed] wiping collections...");
  await Promise.all([
    User.deleteMany({}),
    Product.deleteMany({}),
    Customer.deleteMany({}),
    Order.deleteMany({}),
    Shop.deleteMany({}),
    Subscription.deleteMany({}),
  ]);

  console.log("[seed] creating SaaS admin (no shop)...");
  const admin = new User({
    name: "Platform Admin",
    email: "admin@dokanpro.com",
    role: "admin",
    phone: "+8801711111111",
  });
  await admin.setPassword("admin123");
  await admin.save();

  console.log("[seed] creating staff (shop owner) + shop...");
  const staff = new User({
    name: "Rahim Mia",
    email: "staff@dokanpro.com",
    role: "staff",
    phone: "+8801722222222",
  });
  await staff.setPassword("staff123");
  await staff.save();

  const shop = await Shop.create({
    name: "Rahim Store",
    owner: staff._id,
    phone: staff.phone,
    address: "Dhanmondi, Dhaka",
  });

  staff.shop = shop._id;
  await staff.save();

  console.log("[seed] creating active subscription (30 days from now)...");
  const now = new Date();
  const endDate = new Date(
    now.getTime() + PLANS.monthly.durationDays * 24 * 60 * 60 * 1000,
  );

  const subscription = await Subscription.create({
    shop: shop._id,
    plan: "monthly",
    amount: PLANS.monthly.amount,
    paidAmount: PLANS.monthly.amount,
    paymentMethod: "bkash",
    transactionId: "SEED" + Date.now(),
    status: "active",
    startDate: now,
    endDate,
    verifiedBy: admin._id,
    verifiedAt: now,
    notes: "Created automatically by seed script",
  });

  shop.currentSubscription = subscription._id;
  await shop.save();

  console.log("[seed] creating products...");

  const productsWithShop = sampleProducts.map((product) => ({
    ...product,
    shop: shop._id,
  }));

  await Product.insertMany(productsWithShop);

  console.log("[seed] creating customers...");
  await Customer.insertMany(sampleCustomers);

  console.log("\n✅ Seed complete!");
  console.log("────────────────────────────────────");
  console.log(" SaaS Admin   → admin@dokanpro.com / admin123");
  console.log(" Shop Staff   → staff@dokanpro.com / staff123");
  console.log("────────────────────────────────────");
  console.log(` Shop:         ${shop.name}`);
  console.log(
    ` Subscription: monthly · active · expires ${endDate.toDateString()}`,
  );
  console.log(` Products:     ${sampleProducts.length}`);
  console.log(` Customers:    ${sampleCustomers.length}`);

  await disconnectDB();
  process.exit(0);
}

run().catch(async (err) => {
  console.error("[seed] failed:", err);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});

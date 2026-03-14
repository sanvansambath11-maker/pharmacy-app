import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

const client = new MongoClient(process.env.MONGO_URL);
const dbName = process.env.DB_NAME || 'globalrx';

async function getDb() {
  await client.connect();
  return client.db(dbName);
}

export async function GET(request, { params }) {
  const resolvedParams = await params;
  const path = resolvedParams?.path || [];

  try {
    if (path[0] === 'health') {
      return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
    }

    if (path[0] === 'products') {
      const db = await getDb();
      if (path[1]) {
        const product = await db.collection('products').findOne({ id: path[1] });
        if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        return NextResponse.json(product);
      }
      const categoryFilter = new URL(request.url).searchParams.get('category');
      const query = categoryFilter ? { category: categoryFilter } : {};
      const products = await db.collection('products').find(query).toArray();
      return NextResponse.json(products);
    }

    if (path[0] === 'categories') {
      const db = await getDb();
      const categories = await db.collection('categories').find({}).toArray();
      return NextResponse.json(categories);
    }

    if (path[0] === 'cart' && path[1]) {
      const db = await getDb();
      const cart = await db.collection('carts').findOne({ sessionId: path[1] });
      return NextResponse.json(cart || { sessionId: path[1], items: [] });
    }

    return NextResponse.json({ status: 'Batto Pharmacy API', version: '1.0' });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const resolvedParams = await params;
  const path = resolvedParams?.path || [];

  try {
    if (path[0] === 'seed') {
      const db = await getDb();
      const { categories, products } = await request.json();
      
      if (categories && categories.length > 0) {
        await db.collection('categories').deleteMany({});
        await db.collection('categories').insertMany(categories);
      }
      if (products && products.length > 0) {
        await db.collection('products').deleteMany({});
        await db.collection('products').insertMany(products);
      }
      
      return NextResponse.json({ status: 'seeded', categories: categories?.length || 0, products: products?.length || 0 });
    }

    if (path[0] === 'cart' && path[1] === 'add') {
      const db = await getDb();
      const { sessionId, productId, quantity } = await request.json();
      
      const cart = await db.collection('carts').findOne({ sessionId }) || { sessionId, items: [] };
      const existingIdx = cart.items.findIndex(i => i.productId === productId);
      
      if (existingIdx >= 0) {
        cart.items[existingIdx].quantity += quantity;
      } else {
        cart.items.push({ id: uuidv4(), productId, quantity });
      }
      
      await db.collection('carts').updateOne(
        { sessionId },
        { $set: { items: cart.items, updatedAt: new Date().toISOString() } },
        { upsert: true }
      );
      
      return NextResponse.json(cart);
    }

    if (path[0] === 'prescriptions') {
      const db = await getDb();
      const body = await request.json();
      const prescription = {
        id: uuidv4(),
        ...body,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      await db.collection('prescriptions').insertOne(prescription);
      return NextResponse.json(prescription);
    }

    if (path[0] === 'orders') {
      const db = await getDb();
      const body = await request.json();
      const order = {
        id: uuidv4(),
        orderNumber: `RX-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        ...body,
        status: 'processing',
        createdAt: new Date().toISOString(),
      };
      await db.collection('orders').insertOne(order);
      return NextResponse.json(order);
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const resolvedParams = await params;
  const path = resolvedParams?.path || [];

  try {
    if (path[0] === 'cart' && path[1]) {
      const db = await getDb();
      const { itemId } = await request.json();
      const cart = await db.collection('carts').findOne({ sessionId: path[1] });
      if (cart) {
        cart.items = cart.items.filter(i => i.id !== itemId);
        await db.collection('carts').updateOne({ sessionId: path[1] }, { $set: { items: cart.items } });
      }
      return NextResponse.json(cart || { items: [] });
    }
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

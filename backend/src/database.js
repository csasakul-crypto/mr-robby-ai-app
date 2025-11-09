import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const uri = process.env.MONGODB_URI || 'mongodb://mongo:27017/mr-robby-ai'

export async function connectDB() {
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    })
    console.log('เชื่อมต่อ MongoDB สำเร็จ:', uri)
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการเชื่อมต่อ MongoDB:', error)
    process.exit(1)
  }
}

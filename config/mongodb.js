import mongoose from "mongoose";

let connectionPromise = null;
let listenerRegistered = false;

const connectDB = async () => {
    if (mongoose.connection.readyState === 1) {
        return;
    }
    if (!listenerRegistered) {
        mongoose.connection.on('connected', () => console.log('Database Connected'));
        listenerRegistered = true;
    }
    if (!connectionPromise) {
        connectionPromise = mongoose.connect(`${process.env.MONGODB_URI}/prescripto`).catch((err) => {
            connectionPromise = null;
            throw err;
        });
    }
    await connectionPromise;
};

export default connectDB;

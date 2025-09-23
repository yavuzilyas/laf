// src/lib/server/db/mongo.ts
import { MongoClient } from 'mongodb';
import { MONGODB_URL } from '$env/static/private';

const client = new MongoClient(MONGODB_URL);

export function start_mongo(): Promise<MongoClient> {
    console.log("Connecting to MongoDB...");
    return client.connect();
}

export default client.db("laf_app");

// Bağlantıyı bir promise olarak export et
export const clientPromise = client.connect();

// === Collections ===
export const getUsersCollection = async () => {
    const db = (await clientPromise).db("laf_app");
    return db.collection("users");
};

export const getArticlesCollection = async () => {
    const db = (await clientPromise).db("laf_app");
    return db.collection("articles");
};

// yeni: drafts collection
export const getDraftsCollection = async () => {
    const db = (await clientPromise).db("laf_app");
    return db.collection("drafts");
};

// yeni: versions collection
export const getVersionsCollection = async () => {
    const db = (await clientPromise).db("laf_app");
    return db.collection("versions");
};

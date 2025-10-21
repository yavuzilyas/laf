// src/lib/server/db/mongo.ts (genişletilmiş)
import { MongoClient, ObjectId } from 'mongodb';
import { MONGODB_URL } from '$env/static/private';

const client = new MongoClient(MONGODB_URL);

export function start_mongo(): Promise<MongoClient> {
    console.log("Connecting to MongoDB...");
    return client.connect();
}

export default client.db("laf_app");
export const clientPromise = client.connect();

// Collections
export const getUsersCollection = async () => {
    const db = (await clientPromise).db("laf_app");
    return db.collection("users");
};

export const getArticlesCollection = async () => {
    const db = (await clientPromise).db("laf_app");
    return db.collection("articles");
};

export const getDraftsCollection = async () => {
    const db = (await clientPromise).db("laf_app");
    return db.collection("drafts");
};

export const getVersionsCollection = async () => {
    const db = (await clientPromise).db("laf_app");
    return db.collection("versions");
};

export const getCommentsCollection = async () => {
    const db = (await clientPromise).db("laf_app");
    return db.collection("comments");
};

export const getSavesCollection = async () => {
    const db = (await clientPromise).db("laf_app");
    return db.collection("saves");
};

export const getLikesCollection = async () => {
    const db = (await clientPromise).db("laf_app");
    return db.collection("likes");
};

export const getNotificationsCollection = async () => {
    const db = (await clientPromise).db("laf_app");
    return db.collection("notifications");
};

// Yardımcı fonksiyonlar
export const toObjectId = (id: string | ObjectId): ObjectId => {
    return typeof id === 'string' ? new ObjectId(id) : id;
};

export const fromObjectId = (obj: any) => {
    if (obj && obj._id) {
        obj._id = obj._id.toString();
    }
    return obj;
};
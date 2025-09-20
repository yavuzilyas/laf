import { MongoClient } from 'mongodb';
import { MONGODB_URL } from '$env/static/private';
const client = new MongoClient( MONGODB_URL );

export function start_mongo() : Promise<MongoClient> {
    console.log("Connecting to MongoDB...");
    return client.connect();
}
export default client.db();


// Bağlantıyı bir promise olarak export et
export const clientPromise = client.connect();


export const getUsersCollection = async () => {
  const db = (await client).db("laf_app");
  return db.collection("users");
};

export const getArticlesCollection = async () => {
  const db = (await client).db("laf_app");
  return db.collection("articles");
};
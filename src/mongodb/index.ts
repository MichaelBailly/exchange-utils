import { MongoClient } from 'mongodb';

export const MONGO_DB = process.env.MONGO_DB;
export const MONGO_COLLECTION = process.env.MONGO_COLLECTION;

export let mongoclient: null | MongoClient = null;

export async function getMongoCollection() {
  if (!MONGO_DB || !MONGO_COLLECTION) {
    throw new Error('MONGO_DB and MONGO_COLLECTION env vars are required');
  }
  mongoclient = new MongoClient(MONGO_DB, {});
  await mongoclient.connect();
  return mongoclient.db().collection(MONGO_COLLECTION);
}

export async function close() {
  if (mongoclient) {
    await mongoclient.close();
  }
}

import { start_mongo } from './db/mongo';

start_mongo().then(() : void  => { console.log("MongoDB connected."); } ).catch( (err) : void => { console.error("MongoDB connection error:", err); } );

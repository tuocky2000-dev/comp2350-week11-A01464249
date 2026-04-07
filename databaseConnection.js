const MongoClient = require("mongodb").MongoClient;
require("dotenv").config();
const is_hosted = process.env.IS_HOSTED || false;
const hostedURI =
"mongodb+srv://theMongoAdmin:ky2007vn@cluster0.9bv1gyl.mongodb.net/lab_example?appName=Cluster0"
const localURI = "mongodb://127.0.0.1/?authSource=admin&retryWrites=true&w=majority"
if (is_hosted) {
var database = new MongoClient(hostedURI);
}
else {
var database = new MongoClient(localURI);
}
module.exports = database;
		
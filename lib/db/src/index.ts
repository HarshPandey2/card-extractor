import {
  Collection,
  Db,
  MongoClient,
  ObjectId,
  ServerApiVersion,
  type Filter,
} from "mongodb";

export type UserRole = "user" | "admin";

export interface ExtractedCardData {
  name: string;
  phones: string[];
  emails: string[];
  company: string;
  designation: string;
  address: string;
  website: string;
}

export interface UserDocument {
  _id: ObjectId;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  isVerified: boolean;
  otp: string | null;
  otpExpiry: Date | null;
  otpLastSentAt: Date | null;
  createdAt: Date;
}

export interface CardDocument {
  _id: ObjectId;
  userId: ObjectId;
  extractedData: ExtractedCardData;
  frontImageBase64?: string | null;
  backImageBase64?: string | null;
  createdAt: Date;
  // Legacy fields preserved so old records continue to work during migration.
  name?: string;
  phones?: string[];
  emails?: string[];
  company?: string;
  designation?: string;
  address?: string;
  website?: string;
}

interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  isVerified?: boolean;
}

interface CreateCardInput {
  userId: string;
  extractedData: ExtractedCardData;
  frontImageBase64?: string | null;
  backImageBase64?: string | null;
}

interface ListCardsOptions {
  page: number;
  limit: number;
}

interface AdminCardSearchOptions extends ListCardsOptions {
  search?: string;
}

let clientPromise: Promise<MongoClient> | null = null;
let dbPromise: Promise<Db> | null = null;
let indexesReady = false;

function getMongoUri() {
  const uri = process.env.DATABASE_URL?.trim();
  if (!uri) {
    throw new Error("DATABASE_URL must be set to your MongoDB Atlas connection string.");
  }
  if (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://")) {
    throw new Error("DATABASE_URL must be a valid MongoDB connection string.");
  }
  return uri;
}

function getDbName() {
  return process.env.MONGODB_DB_NAME?.trim() || "visiting_cards";
}

async function getClient() {
  if (!clientPromise) {
    const uri = getMongoUri();
    const client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        deprecationErrors: true,
      },
    });
    clientPromise = client.connect();
  }

  return clientPromise;
}

async function getDatabase() {
  if (!dbPromise) {
    dbPromise = getClient().then((client) => client.db(getDbName()));
  }

  return dbPromise;
}

async function getUsersCollection(): Promise<Collection<UserDocument>> {
  const db = await getDatabase();
  return db.collection<UserDocument>("users");
}

async function getCardsCollection(): Promise<Collection<CardDocument>> {
  const db = await getDatabase();
  return db.collection<CardDocument>("cards");
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeCardData(card: Partial<ExtractedCardData>): ExtractedCardData {
  return {
    name: String(card.name || ""),
    phones: Array.isArray(card.phones) ? card.phones.map(String) : [],
    emails: Array.isArray(card.emails) ? card.emails.map(String) : [],
    company: String(card.company || ""),
    designation: String(card.designation || ""),
    address: String(card.address || ""),
    website: String(card.website || ""),
  };
}

export function getCardData(card: CardDocument): ExtractedCardData {
  if (card.extractedData) {
    return normalizeCardData(card.extractedData);
  }

  return normalizeCardData({
    name: card.name,
    phones: card.phones,
    emails: card.emails,
    company: card.company,
    designation: card.designation,
    address: card.address,
    website: card.website,
  });
}

async function ensureIndexes() {
  if (indexesReady) return;

  const [users, cards] = await Promise.all([
    getUsersCollection(),
    getCardsCollection(),
  ]);

  await Promise.all([
    users.createIndex({ email: 1 }, { unique: true, name: "users_email_unique" }),
    cards.createIndex({ userId: 1, createdAt: -1 }, { name: "cards_user_created_at" }),
    cards.createIndex({ createdAt: -1 }, { name: "cards_created_at_desc" }),
  ]);

  indexesReady = true;
}

export async function verifyDatabaseConnection() {
  const db = await getDatabase();
  await db.command({ ping: 1 });
  await ensureIndexes();
}

export function isValidObjectId(value: string) {
  return ObjectId.isValid(value);
}

function toObjectId(value: string) {
  if (!isValidObjectId(value)) {
    throw new Error("Invalid MongoDB ObjectId");
  }
  return new ObjectId(value);
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function findUserByEmail(email: string) {
  const users = await getUsersCollection();
  return users.findOne({ email: normalizeEmail(email) });
}

export async function findUserById(id: string) {
  const users = await getUsersCollection();
  return users.findOne({ _id: toObjectId(id) });
}

export async function createUser(input: CreateUserInput) {
  const users = await getUsersCollection();
  const doc: Omit<UserDocument, "_id"> = {
    name: input.name.trim(),
    email: normalizeEmail(input.email),
    password: input.password,
    role: input.role ?? "user",
    isVerified: input.isVerified ?? input.role === "admin",
    otp: null,
    otpExpiry: null,
    otpLastSentAt: null,
    createdAt: new Date(),
  };

  const result = await users.insertOne(doc as UserDocument);
  return { _id: result.insertedId, ...doc } satisfies UserDocument;
}

export async function ensureAdminUser(input: {
  name: string;
  email: string;
  password: string;
}) {
  const users = await getUsersCollection();
  const email = normalizeEmail(input.email);
  const existing = await users.findOne({ email });

  if (existing) {
    await users.updateOne(
      { _id: existing._id },
      {
        $set: {
          name: input.name.trim(),
          password: input.password,
          role: "admin",
          isVerified: true,
          otp: null,
          otpExpiry: null,
          otpLastSentAt: null,
        },
      },
    );

    return users.findOne({ _id: existing._id });
  }

  return createUser({
    name: input.name,
    email,
    password: input.password,
    role: "admin",
    isVerified: true,
  });
}

export async function ensureClientUser(input: {
  name: string;
  email: string;
  password: string;
}) {
  const users = await getUsersCollection();
  const email = normalizeEmail(input.email);
  const existing = await users.findOne({ email });

  if (existing) {
    await users.updateOne(
      { _id: existing._id },
      {
        $set: {
          name: input.name.trim(),
          password: input.password,
          role: "user",
          isVerified: true,
          otp: null,
          otpExpiry: null,
          otpLastSentAt: null,
        },
      },
    );

    return users.findOne({ _id: existing._id });
  }

  return createUser({
    name: input.name,
    email,
    password: input.password,
    role: "user",
    isVerified: true,
  });
}

export async function setUserOtp(userId: string, otp: string, otpExpiry: Date) {
  const users = await getUsersCollection();
  await users.updateOne(
    { _id: toObjectId(userId) },
    {
      $set: {
        otp,
        otpExpiry,
        otpLastSentAt: new Date(),
      },
    },
  );
}

export async function clearUserOtp(userId: string) {
  const users = await getUsersCollection();
  await users.updateOne(
    { _id: toObjectId(userId) },
    {
      $set: {
        otp: null,
        otpExpiry: null,
      },
    },
  );
}

export async function markUserVerified(userId: string) {
  const users = await getUsersCollection();
  await users.updateOne(
    { _id: toObjectId(userId) },
    {
      $set: {
        isVerified: true,
        otp: null,
        otpExpiry: null,
      },
    },
  );
}

export async function listUsersWithCardCounts() {
  const users = await getUsersCollection();

  return users
    .aggregate<
      UserDocument & {
        cardCount: number;
      }
    >([
      {
        $lookup: {
          from: "cards",
          localField: "_id",
          foreignField: "userId",
          as: "cards",
        },
      },
      {
        $addFields: {
          cardCount: { $size: "$cards" },
        },
      },
      {
        $project: {
          cards: 0,
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
    ])
    .toArray();
}

export async function createCard(input: CreateCardInput) {
  const cards = await getCardsCollection();
  const extractedData = normalizeCardData(input.extractedData);
  const doc: Omit<CardDocument, "_id"> = {
    userId: toObjectId(input.userId),
    extractedData,
    frontImageBase64: input.frontImageBase64 ?? null,
    backImageBase64: input.backImageBase64 ?? null,
    createdAt: new Date(),
    name: extractedData.name,
    phones: extractedData.phones,
    emails: extractedData.emails,
    company: extractedData.company,
    designation: extractedData.designation,
    address: extractedData.address,
    website: extractedData.website,
  };

  const result = await cards.insertOne(doc as CardDocument);
  return { _id: result.insertedId, ...doc } satisfies CardDocument;
}

export async function listCardsByUser(userId: string, options: ListCardsOptions) {
  const cards = await getCardsCollection();
  const filter = { userId: toObjectId(userId) };
  const skip = Math.max(0, (options.page - 1) * options.limit);

  const [items, total] = await Promise.all([
    cards.find(filter).sort({ createdAt: -1 }).skip(skip).limit(options.limit).toArray(),
    cards.countDocuments(filter),
  ]);

  return { items, total };
}

export async function deleteCardForUser(cardId: string, userId: string) {
  const cards = await getCardsCollection();
  return cards.findOneAndDelete({
    _id: toObjectId(cardId),
    userId: toObjectId(userId),
  });
}

function buildAdminCardSearchFilter(search?: string): Filter<CardDocument> {
  if (!search) return {};

  const regex = new RegExp(escapeRegex(search), "i");
  return {
    $or: [
      { "extractedData.name": regex },
      { "extractedData.company": regex },
      { "extractedData.emails": regex },
      { "extractedData.phones": regex },
      { name: regex },
      { company: regex },
      { emails: regex },
      { phones: regex },
    ],
  };
}

export async function listAdminCards(options: AdminCardSearchOptions) {
  const cards = await getCardsCollection();
  const filter = buildAdminCardSearchFilter(options.search?.trim());
  const skip = Math.max(0, (options.page - 1) * options.limit);

  const [items, total] = await Promise.all([
    cards
      .aggregate<
        CardDocument & {
          user?: Pick<UserDocument, "_id" | "name">[];
        }
      >([
        { $match: filter },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: options.limit },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
      ])
      .toArray(),
    cards.countDocuments(filter),
  ]);

  return { items, total };
}

export async function deleteAdminCard(cardId: string) {
  const cards = await getCardsCollection();
  return cards.findOneAndDelete({ _id: toObjectId(cardId) });
}

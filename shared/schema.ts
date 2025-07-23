import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  age: integer("age").notNull(),
  location: text("location").notNull(),
  bio: text("bio"),
  profileVideoUrl: text("profile_video_url"),
  interests: text("interests").array(),
  instagramConnected: boolean("instagram_connected").default(false),
  instagramId: varchar("instagram_id", { length: 255 }),
  instagramProfile: text("instagram_profile"),
  tiktokConnected: boolean("tiktok_connected").default(false),
  tiktokId: varchar("tiktok_id", { length: 255 }),
  tiktokProfile: text("tiktok_profile"),
  facebookConnected: boolean("facebook_connected").default(false),
  facebookId: varchar("facebook_id", { length: 255 }),
  facebookProfile: text("facebook_profile"),
  twitterConnected: boolean("twitter_connected").default(false),
  twitterId: varchar("twitter_id", { length: 255 }),
  twitterProfile: text("twitter_profile"),
  isPremium: boolean("is_premium").default(false),
  subscriptionPlan: varchar("subscription_plan", { length: 50 }).default("free"), // free, premium, gold
  subscriptionExpiry: timestamp("subscription_expiry"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  userId1: integer("user_id_1").notNull().references(() => users.id),
  userId2: integer("user_id_2").notNull().references(() => users.id),
  isMatch: boolean("is_match").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  fromUserId: integer("from_user_id").notNull().references(() => users.id),
  toUserId: integer("to_user_id").notNull().references(() => users.id),
  isLike: boolean("is_like").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull().references(() => matches.id),
  senderId: integer("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  messageType: varchar("message_type", { length: 20 }).notNull().default("text"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userRelations = relations(users, ({ many }) => ({
  sentLikes: many(likes, { relationName: "sentLikes" }),
  receivedLikes: many(likes, { relationName: "receivedLikes" }),
  matches1: many(matches, { relationName: "matches1" }),
  matches2: many(matches, { relationName: "matches2" }),
  messages: many(messages),
}));

export const matchRelations = relations(matches, ({ one, many }) => ({
  user1: one(users, { fields: [matches.userId1], references: [users.id], relationName: "matches1" }),
  user2: one(users, { fields: [matches.userId2], references: [users.id], relationName: "matches2" }),
  messages: many(messages),
}));

export const likeRelations = relations(likes, ({ one }) => ({
  fromUser: one(users, { fields: [likes.fromUserId], references: [users.id], relationName: "sentLikes" }),
  toUser: one(users, { fields: [likes.toUserId], references: [users.id], relationName: "receivedLikes" }),
}));

export const messageRelations = relations(messages, ({ one }) => ({
  match: one(matches, { fields: [messages.matchId], references: [matches.id] }),
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  displayName: true,
  age: true,
  location: true,
  bio: true,
  interests: true,
});

export const insertLikeSchema = createInsertSchema(likes).pick({
  toUserId: true,
  isLike: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  matchId: true,
  content: true,
  messageType: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertLike = z.infer<typeof insertLikeSchema>;
export type Like = typeof likes.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

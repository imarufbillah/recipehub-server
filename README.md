# RecipeHub — Server

The REST API backend for [RecipeHub](https://recipehub-by-marufbillah.vercel.app), a premium culinary publishing platform where home cooks and food enthusiasts share, discover, and unlock recipes.

Built with **Express.js** and **MongoDB**, deployed on **Vercel**.

**Frontend repository:** [github.com/imarufbillah/recipehub-client](https://github.com/imarufbillah/recipehub-client)

---

## Table of Contents

- [Live API](#live-api)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [API Reference](#api-reference)
  - [Recipes](#recipes)
  - [Users](#users)
  - [Likes](#likes)
  - [Favorites](#favorites)
  - [Purchases](#purchases)
  - [Subscriptions](#subscriptions)
  - [Reports](#reports)
  - [Transactions](#transactions)
- [Data Models](#data-models)
- [Authorization Roles](#authorization-roles)
- [Error Handling](#error-handling)
- [Deployment](#deployment)
- [License](#license)

---

## Live API

**Base URL:** The API is deployed on Vercel. Set `NEXT_PUBLIC_API_URL` in your frontend to point at this service.

Health check:

```
GET /
→ "Server is cooking!"
```

---

## Features

- Full CRUD for recipes with rich filtering, search, sorting, and pagination
- Role-based access control — **user** and **admin** roles enforced via JWT middleware
- **Free tier enforcement** — free-plan users are limited to 2 published recipes
- Like and favorite system with atomic counter updates on both recipe and author documents
- **Premium recipes** — content gating (ingredients and steps hidden until purchased)
- Recipe reporting system with admin review workflow (resolve → deletes recipe, dismiss → closes report)
- Stripe-integrated purchase and subscription tracking
- Unified transaction ledger merging subscription payments and recipe purchases
- Admin dashboard endpoints for user management (block/unblock/delete with full data cleanup), recipe management, and platform statistics
- In-memory caching for category and cuisine aggregations (5-minute TTL)
- CORS-enabled with all standard HTTP methods allowed

---

## Tech Stack

| Layer          | Technology                                |
| -------------- | ----------------------------------------- |
| Runtime        | Node.js                                   |
| Framework      | Express.js v5                             |
| Database       | MongoDB (official Node.js driver)         |
| Authentication | `jose-cjs` — remote JWKS JWT verification |
| Environment    | `dotenv`                                  |
| CORS           | `cors`                                    |
| Deployment     | Vercel (serverless Node)                  |

---

## Project Structure

```
recipehub-server/
├── index.js                     # Express app entry point — mounts all routes
├── vercel.json                  # Vercel deployment configuration
├── package.json
├── .env                         # Local environment variables (not committed)
└── src/
    ├── config/
    │   └── db.js                # MongoDB client + database instance
    ├── middlewares/
    │   ├── verifyToken.js       # JWT verification via remote JWKS
    │   └── verifyAdmin.js       # Role guard — requires role === "admin"
    ├── controllers/
    │   ├── recipes.controller.js
    │   ├── users.controller.js
    │   ├── likes.controller.js
    │   ├── favorites.controller.js
    │   ├── purchases.controller.js
    │   ├── subscriptions.controller.js
    │   ├── reports.controller.js
    │   └── transactions.controller.js
    └── routes/
        ├── recipes.routes.js
        ├── users.routes.js
        ├── likes.routes.js
        ├── favorites.routes.js
        ├── purchases.routes.js
        ├── subscriptions.routes.js
        ├── reports.routes.js
        └── transactions.routes.js
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
PORT=8000
MONGO_DB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/
CLIENT_BASE_URL=http://localhost:3000
```

| Variable          | Description                                                                                                                 |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `PORT`            | Port the Express server listens on                                                                                          |
| `MONGO_DB_URI`    | MongoDB connection string. The server connects to a database named `recipehub`.                                             |
| `CLIENT_BASE_URL` | Base URL of the Next.js frontend. Used to fetch the JWKS endpoint for JWT verification (`{CLIENT_BASE_URL}/api/auth/jwks`). |

---

## Authentication

All protected routes require a **Bearer token** in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

Tokens are issued by the frontend's `better-auth` service and verified against its JWKS endpoint. The middleware decodes the payload and attaches it to `req.user`, which contains at minimum:

| Claim  | Description                                        |
| ------ | -------------------------------------------------- |
| `id`   | The authenticated user's MongoDB `_id` as a string |
| `role` | `"user"` or `"admin"`                              |

Unauthenticated requests to protected routes receive `401 Unauthorized`. Requests by non-admins to admin-only routes receive `403 Forbidden`.

---

## API Reference

All responses are JSON. Successful mutations return a `{ message }` object. Errors return `{ message }` with an appropriate HTTP status code.

---

### Recipes

| Method   | Endpoint                             | Auth         | Description                                            |
| -------- | ------------------------------------ | ------------ | ------------------------------------------------------ |
| `GET`    | `/recipes`                           | Public       | Paginated recipe listing with filtering and sorting    |
| `POST`   | `/recipes`                           | User         | Create a new recipe                                    |
| `GET`    | `/recipes/categories`                | Public       | List all distinct categories (cached 5 min)            |
| `GET`    | `/recipes/cuisines`                  | Public       | List all distinct cuisines (cached 5 min)              |
| `GET`    | `/recipes/featured`                  | Public       | Get featured recipes (max 4)                           |
| `GET`    | `/recipes/most-liked`                | Public       | Top 8 recipes sorted by like count                     |
| `GET`    | `/recipes/total`                     | Admin        | Total recipe count                                     |
| `GET`    | `/recipes/admin`                     | Admin        | Paginated recipe list for admin management table       |
| `PATCH`  | `/recipes/feature/:recipeId`         | Admin        | Toggle featured status (max 4 featured at a time)      |
| `GET`    | `/recipes/check-ownership/:recipeId` | User         | Returns `true` if requester is owner or admin          |
| `GET`    | `/recipes/user/:userId`              | User (owner) | All recipes authored by a user                         |
| `GET`    | `/recipes/:recipeId`                 | Public       | Single recipe. Premium content gated if not purchased. |
| `PATCH`  | `/recipes/:recipeId`                 | User / Admin | Update a recipe (admins can edit any recipe)           |
| `DELETE` | `/recipes/:recipeId`                 | User / Admin | Delete a recipe (admins can delete any recipe)         |

#### `GET /recipes` — Query Parameters

| Parameter     | Type    | Description                                                        |
| ------------- | ------- | ------------------------------------------------------------------ |
| `q`           | string  | Full-text search on `recipeName` and `description`                 |
| `category`    | string  | Comma-separated category values (case-insensitive)                 |
| `cuisine`     | string  | Cuisine name (case-insensitive)                                    |
| `difficulty`  | string  | Difficulty level (case-insensitive)                                |
| `isPremium`   | boolean | Filter by `true` or `false`                                        |
| `isFeatured`  | boolean | Filter by `true` or `false`                                        |
| `minPrice`    | number  | Minimum price (for premium recipes)                                |
| `maxPrice`    | number  | Maximum price                                                      |
| `maxPrepTime` | number  | Maximum prep time in minutes                                       |
| `sort`        | string  | `newest` (default), `oldest`, `popular`, `price_asc`, `price_desc` |
| `page`        | number  | Page number (default: `1`)                                         |
| `limit`       | number  | Results per page (default: `12`, max: `50`)                        |

**Response:**

```json
{
  "recipes": [...],
  "total": 120,
  "page": 1,
  "totalPages": 10,
  "limit": 12
}
```

#### `POST /recipes` — Request Body

```json
{
  "recipeName": "Spicy Lamb Tagine",
  "description": "A slow-cooked Moroccan classic.",
  "category": "Main Course",
  "cuisine": "Moroccan",
  "difficulty": "Medium",
  "prepTime": 90,
  "servings": 4,
  "isPremium": true,
  "price": 4.99,
  "imageUrl": "https://cdn.imgbb.com/...",
  "ingredients": ["1kg lamb shoulder", "2 onions", "..."],
  "steps": ["Brown the lamb...", "Add spices..."],
  "userId": "<MongoDB ObjectId string>",
  "author": "Jane Doe"
}
```

> **Free tier limit:** Users on the `free` plan are blocked after publishing 2 recipes.

---

### Users

| Method   | Endpoint                 | Auth         | Description                                         |
| -------- | ------------------------ | ------------ | --------------------------------------------------- |
| `GET`    | `/users`                 | Admin        | Paginated list of all non-admin users               |
| `GET`    | `/users/total`           | Admin        | Total user count                                    |
| `GET`    | `/users/premium`         | Admin        | Count of users on the `premium` plan                |
| `PATCH`  | `/users/block/:userId`   | Admin        | Set `isBlocked: true` on a user                     |
| `PATCH`  | `/users/unblock/:userId` | Admin        | Set `isBlocked: false` on a user                    |
| `PATCH`  | `/users/:userId`         | User (owner) | Update own profile fields (name, avatar, bio, etc.) |
| `DELETE` | `/users/:userId`         | Admin        | Delete a user and all their associated data         |

> Deleting a user cascades and removes their recipes, favorites, likes, purchases, reports, and subscriptions.

---

### Likes

| Method   | Endpoint        | Auth | Description                                  |
| -------- | --------------- | ---- | -------------------------------------------- |
| `POST`   | `/likes`        | User | Like a recipe                                |
| `DELETE` | `/likes`        | User | Unlike a recipe                              |
| `GET`    | `/likes/status` | User | Check if the current user has liked a recipe |

#### `POST /likes` — Request Body

```json
{ "userId": "<userId>", "recipeId": "<recipeId>" }
```

#### `DELETE /likes` — Request Body

```json
{ "userId": "<userId>", "recipeId": "<recipeId>" }
```

#### `GET /likes/status` — Query Parameters

```
?userId=<userId>&recipeId=<recipeId>
```

Returns `true` or `false`.

Liking a recipe atomically increments `likeCount` on the recipe document and `totalLikes` on the author's user document. Unliking decrements both.

---

### Favorites

| Method   | Endpoint                  | Auth         | Description                                            |
| -------- | ------------------------- | ------------ | ------------------------------------------------------ |
| `POST`   | `/favorites`              | User         | Add a recipe to favorites                              |
| `DELETE` | `/favorites`              | User         | Remove a recipe from favorites                         |
| `GET`    | `/favorites/status`       | User         | Check if the current user has favorited a recipe       |
| `GET`    | `/favorites/user/:userId` | User (owner) | All favorited recipes for a user (with recipe details) |

#### `POST /favorites` / `DELETE /favorites` — Request Body

```json
{ "userId": "<userId>", "recipeId": "<recipeId>" }
```

#### `GET /favorites/status` — Query Parameters

```
?userId=<userId>&recipeId=<recipeId>
```

Returns `true` or `false`.

Adding a favorite increments `favoriteCount` on the recipe and `totalFavorites` on the author. Removing decrements both.

---

### Purchases

| Method | Endpoint                  | Auth         | Description                                      |
| ------ | ------------------------- | ------------ | ------------------------------------------------ |
| `POST` | `/purchases`              | User         | Record a completed recipe purchase (post-Stripe) |
| `GET`  | `/purchases/status`       | User         | Check if the current user has purchased a recipe |
| `GET`  | `/purchases/user/:userId` | User (owner) | All purchases for a user (with recipe details)   |

#### `POST /purchases` — Request Body

```json
{
  "userId": "<userId>",
  "recipeId": "<recipeId>",
  "amount": 4.99,
  "currency": "usd",
  "purchasedAt": "2024-11-15T10:30:00.000Z",
  "stripePaymentIntentId": "pi_..."
}
```

Duplicate purchases for the same user + recipe are rejected with `400`.

#### `GET /purchases/status` — Query Parameters

```
?userId=<userId>&recipeId=<recipeId>
```

Returns `true` or `false`. Used to gate premium recipe content on the detail page.

---

### Subscriptions

| Method | Endpoint         | Auth | Description                                              |
| ------ | ---------------- | ---- | -------------------------------------------------------- |
| `POST` | `/subscriptions` | User | Create a subscription record and upgrade user to premium |

#### `POST /subscriptions` — Request Body

```json
{
  "userId": "<userId>",
  "plan": "premium",
  "amount": 9.99,
  "stripeSubscriptionId": "sub_...",
  "stripePriceId": "price_...",
  "currentPeriodStart": "2024-11-01T00:00:00.000Z",
  "currentPeriodEnd": "2024-12-01T00:00:00.000Z"
}
```

On success, the user's `plan` field is updated to `"premium"`, unlocking unlimited recipe publishing across the platform.

---

### Reports

| Method  | Endpoint                    | Auth  | Description                                             |
| ------- | --------------------------- | ----- | ------------------------------------------------------- |
| `POST`  | `/reports`                  | User  | Submit a report against a recipe                        |
| `GET`   | `/reports`                  | Admin | Paginated list of all reports                           |
| `GET`   | `/reports/status`           | User  | Check if the current user has already reported a recipe |
| `GET`   | `/reports/total`            | Admin | Total report count                                      |
| `GET`   | `/reports/pending`          | Admin | Count of reports with `status: "pending"`               |
| `PATCH` | `/reports/review/:reportId` | Admin | Resolve or dismiss a report                             |

#### `POST /reports` — Request Body

```json
{
  "userId": "<userId>",
  "recipeId": "<recipeId>",
  "recipeName": "Some Recipe",
  "reporterName": "Jane Doe",
  "reason": "Spam",
  "additionalContext": "This post is clearly spam."
}
```

#### `PATCH /reports/review/:reportId` — Request Body

```json
{ "action": "resolve" }
```

or

```json
{ "action": "dismiss" }
```

- **`resolve`** — sets report status to `"resolved"`, deletes the reported recipe, and decrements the author's recipe count.
- **`dismiss`** — sets report status to `"dismissed"` with no further action.

A report that is already resolved or dismissed cannot be reviewed again.

---

### Transactions

| Method | Endpoint              | Auth  | Description                                             |
| ------ | --------------------- | ----- | ------------------------------------------------------- |
| `GET`  | `/transactions`       | Admin | Merged, paginated ledger of subscriptions and purchases |
| `GET`  | `/transactions/stats` | Admin | Total revenue, subscription count, and purchase count   |

#### `GET /transactions` — Query Parameters

| Parameter | Type   | Description                                                |
| --------- | ------ | ---------------------------------------------------------- |
| `type`    | string | `subscription` or `recipe_purchase` (omit for all)         |
| `status`  | string | Filter by status (`active`, `completed`, etc.)             |
| `from`    | string | ISO date — filter `createdAt` from this date               |
| `to`      | string | ISO date — filter `createdAt` up to this date (end of day) |
| `q`       | string | Search by user name, user email, or transaction `_id`      |
| `page`    | number | Page number (default: `1`)                                 |
| `limit`   | number | Results per page (default: `20`, max: `50`)                |

**Response:**

```json
{
  "transactions": [
    {
      "type": "subscription",
      "amount": 9.99,
      "status": "active",
      "createdAt": "2024-11-01T00:00:00.000Z",
      "userId": "...",
      "userName": "Jane Doe",
      "userEmail": "jane@example.com",
      "userImage": "https://...",
      "recipeName": null,
      "recipeId": null
    }
  ],
  "total": 42,
  "totalPages": 3,
  "page": 1
}
```

#### `GET /transactions/stats` — Response

```json
{
  "totalRevenue": 249.87,
  "subscriptionCount": 18,
  "recipePurchaseCount": 34
}
```

Total revenue counts only `active` subscriptions and `completed` purchases.

---

## Data Models

### Recipe

| Field           | Type     | Description                                                  |
| --------------- | -------- | ------------------------------------------------------------ |
| `_id`           | ObjectId | MongoDB auto-generated ID                                    |
| `recipeName`    | string   | Recipe title                                                 |
| `description`   | string   | Short description                                            |
| `category`      | string   | e.g. `"Main Course"`, `"Dessert"`                            |
| `cuisine`       | string   | e.g. `"Italian"`, `"Japanese"`                               |
| `difficulty`    | string   | e.g. `"Easy"`, `"Medium"`, `"Hard"`                          |
| `prepTime`      | number   | Preparation time in minutes                                  |
| `servings`      | number   | Number of servings                                           |
| `isPremium`     | boolean  | Whether the recipe requires a purchase to access             |
| `price`         | number   | Purchase price (required if `isPremium: true`)               |
| `imageUrl`      | string   | CDN URL for the recipe image                                 |
| `ingredients`   | string[] | List of ingredients (hidden for unpurchased premium recipes) |
| `steps`         | string[] | Cooking steps (hidden for unpurchased premium recipes)       |
| `userId`        | ObjectId | Reference to the authoring user                              |
| `author`        | string   | Display name of the author                                   |
| `status`        | string   | `"active"` or `"flagged"`                                    |
| `isFeatured`    | boolean  | Whether the recipe is featured on the homepage               |
| `likeCount`     | number   | Denormalised total likes                                     |
| `favoriteCount` | number   | Denormalised total favorites                                 |
| `createdAt`     | Date     | Creation timestamp                                           |
| `updatedAt`     | Date     | Last update timestamp                                        |

### User

| Field            | Type     | Description                             |
| ---------------- | -------- | --------------------------------------- |
| `_id`            | ObjectId | MongoDB auto-generated ID               |
| `name`           | string   | Display name                            |
| `email`          | string   | Email address                           |
| `image`          | string   | Avatar URL                              |
| `role`           | string   | `"user"` or `"admin"`                   |
| `plan`           | string   | `"free"` or `"premium"`                 |
| `isBlocked`      | boolean  | Whether the account is blocked          |
| `recipes`        | number   | Count of published recipes              |
| `totalLikes`     | number   | Total likes received across all recipes |
| `totalFavorites` | number   | Total times any recipe was favorited    |
| `createdAt`      | Date     | Registration timestamp                  |

### Purchase

| Field                   | Type     | Description                             |
| ----------------------- | -------- | --------------------------------------- |
| `_id`                   | ObjectId | MongoDB auto-generated ID               |
| `userId`                | ObjectId | Reference to the purchasing user        |
| `recipeId`              | ObjectId | Reference to the purchased recipe       |
| `amount`                | number   | Amount paid                             |
| `currency`              | string   | Currency code (lowercase, e.g. `"usd"`) |
| `status`                | string   | Always `"completed"` on creation        |
| `purchasedAt`           | Date     | Stripe payment timestamp                |
| `stripePaymentIntentId` | string   | Stripe PaymentIntent ID                 |
| `createdAt`             | Date     | Record creation timestamp               |

### Subscription

| Field                  | Type     | Description                       |
| ---------------------- | -------- | --------------------------------- |
| `_id`                  | ObjectId | MongoDB auto-generated ID         |
| `userId`               | ObjectId | Reference to the subscriber       |
| `plan`                 | string   | `"premium"`                       |
| `amount`               | number   | Subscription amount               |
| `stripeSubscriptionId` | string   | Stripe Subscription ID            |
| `stripePriceId`        | string   | Stripe Price ID                   |
| `currentPeriodStart`   | Date     | Billing period start              |
| `currentPeriodEnd`     | Date     | Billing period end                |
| `cancelAtPeriodEnd`    | boolean  | Whether cancellation is scheduled |
| `canceledAt`           | Date     | Cancellation timestamp, or `null` |
| `createdAt`            | Date     | Record creation timestamp         |

### Report

| Field               | Type     | Description                                         |
| ------------------- | -------- | --------------------------------------------------- |
| `_id`               | ObjectId | MongoDB auto-generated ID                           |
| `userId`            | ObjectId | Reference to the user who filed the report          |
| `recipeId`          | ObjectId | Reference to the reported recipe                    |
| `recipeName`        | string   | Denormalized recipe name at time of report          |
| `reporterName`      | string   | Denormalized reporter name at time of report        |
| `reason`            | string   | e.g. `"Spam"`, `"Offensive Content"`, `"Copyright"` |
| `additionalContext` | string   | Optional free-text context from the reporter        |
| `status`            | string   | `"pending"`, `"resolved"`, or `"dismissed"`         |
| `createdAt`         | Date     | Report submission timestamp                         |
| `reviewedAt`        | Date     | Admin review timestamp (set on resolve/dismiss)     |

---

## Authorization Roles

| Role    | Capabilities                                                                                                                                                        |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `user`  | Create/edit/delete own recipes, like/unlike, favorite/unfavorite, purchase recipes, subscribe, report recipes, update own profile                                   |
| `admin` | All user capabilities + manage all users (block/unblock/delete), manage all recipes (edit/delete/feature), review reports, view all transactions and platform stats |

Ownership checks are enforced at the controller level. Users attempting to modify another user's resources receive `401 Unauthorized` or `403 Forbidden` depending on the context.

---

## Error Handling

All errors return a JSON body with a descriptive `message`:

```json
{ "message": "Unauthorized!" }
```

| Status | Meaning                                                                       |
| ------ | ----------------------------------------------------------------------------- |
| `400`  | Bad request — missing fields, duplicate entry, business rule violation        |
| `401`  | Unauthorized — missing or invalid JWT, or requester does not own the resource |
| `403`  | Forbidden — valid token but insufficient role                                 |
| `404`  | Resource not found                                                            |
| `500`  | Internal server error                                                         |

---

## Deployment

The server is configured for **Vercel Serverless** deployment via `vercel.json`.

All routes (`/*`) are routed to `index.js` with CORS headers pre-configured. Supported methods: `GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `OPTIONS`.

```json
{
  "version": 2,
  "builds": [{ "src": "index.js", "use": "@vercel/node" }],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "index.js",
      "methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
    }
  ]
}
```

To deploy:

```bash
vercel
```

Ensure `MONGO_DB_URI` and `CLIENT_BASE_URL` are set in your Vercel project's environment variables.

---

## License

This project is for educational purposes. All rights reserved.

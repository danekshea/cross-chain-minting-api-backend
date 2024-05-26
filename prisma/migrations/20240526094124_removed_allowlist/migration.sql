/*
  Warnings:

  - You are about to drop the `Allowlist` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `phase` on the `Mints` table. All the data in the column will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Allowlist";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Mints" (
    "address" TEXT NOT NULL PRIMARY KEY,
    "uuid" TEXT NOT NULL,
    "status" TEXT NOT NULL
);
INSERT INTO "new_Mints" ("address", "status", "uuid") SELECT "address", "status", "uuid" FROM "Mints";
DROP TABLE "Mints";
ALTER TABLE "new_Mints" RENAME TO "Mints";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

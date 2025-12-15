-- CreateTable
CREATE TABLE "Restock" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sweetId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "restockDate" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Restock_sweetId_fkey" FOREIGN KEY ("sweetId") REFERENCES "Sweet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

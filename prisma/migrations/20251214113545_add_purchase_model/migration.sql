-- CreateTable
CREATE TABLE "Purchase" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sweetId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "customerName" TEXT NOT NULL,
    "totalPrice" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Purchase_sweetId_fkey" FOREIGN KEY ("sweetId") REFERENCES "Sweet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

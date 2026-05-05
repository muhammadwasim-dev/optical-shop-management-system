-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('CREATED', 'IN_PROGRESS', 'READY', 'DELIVERED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'MOBILE_MONEY');

-- CreateEnum
CREATE TYPE "PrescriptionType" AS ENUM ('DISTANCE', 'NEAR', 'BIFOCAL', 'PROGRESSIVE');

-- CreateTable
CREATE TABLE "Prescription" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "rightSph" DECIMAL(4,2),
    "rightCyl" DECIMAL(4,2),
    "rightAxis" INTEGER,
    "rightAdd" DECIMAL(4,2),
    "leftSph" DECIMAL(4,2),
    "leftCyl" DECIMAL(4,2),
    "leftAxis" INTEGER,
    "leftAdd" DECIMAL(4,2),
    "pd" INTEGER NOT NULL,
    "type" "PrescriptionType" NOT NULL,
    "writtenBy" TEXT,
    "writtenOn" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "frameDescription" VARCHAR(500) NOT NULL,
    "lensType" VARCHAR(200) NOT NULL,
    "coatings" VARCHAR(200),
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'CREATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paidOn" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" "PaymentMethod" NOT NULL,
    "note" VARCHAR(200),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Order_prescriptionId_key" ON "Order"("prescriptionId");

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

import { Router, Request, Response } from "express";
import { prisma } from "../db/prisma";
import { BUSINESS_RULES } from "../constants";
import { calculateStraightDistanceKm } from "../utils/geo";

const router = Router();

export interface CustomerWithDistance {
  id: number;
  name: string;
  phone: string;
  addressDetail: string;
  latitude: number;
  longitude: number;
  createdAt: Date;
  distanceKm: number;
  [key: string]: any;
}

// ========================================================
// 1. ค้นลูกค้าทั้งหมดในระยะ 1 กิโลเมตร จากพิกัดที่กำหนด
// GET /api/customers/nearby?lat=16.246825&lng=103.252072&radius=1
// ========================================================
router.get("/nearby", async (req: Request, res: Response) => {
  try {
    const hub = BUSINESS_RULES.HUB;
    const centerLat = req.query.lat ? parseFloat(String(req.query.lat)) : hub.latitude;
    const centerLng = req.query.lng ? parseFloat(String(req.query.lng)) : hub.longitude;
    const radiusKm = req.query.radius ? parseFloat(String(req.query.radius)) : 1.0;

    if (isNaN(centerLat) || isNaN(centerLng) || isNaN(radiusKm) || radiusKm <= 0) {
      return res.status(400).json({ error: "พิกัด lat, lng หรือ radius ต้องเป็นตัวเลขที่ถูกต้องและมากกว่า 0" });
    }

    const customers = await prisma.customer.findMany({
      include: {
        _count: { select: { orders: true } },
      },
      orderBy: { id: "asc" },
    });

    const nearbyCustomers: CustomerWithDistance[] = (customers as any[])
      .map((c: any): CustomerWithDistance => {
        const distanceKm = calculateStraightDistanceKm(
          { latitude: centerLat, longitude: centerLng },
          { latitude: c.latitude, longitude: c.longitude }
        );
        return {
          ...c,
          distanceKm,
        };
      })
      .filter((c: CustomerWithDistance) => c.distanceKm <= radiusKm)
      .sort((a: CustomerWithDistance, b: CustomerWithDistance) => a.distanceKm - b.distanceKm);

    res.json({
      center: { latitude: centerLat, longitude: centerLng },
      radiusKm,
      count: nearbyCustomers.length,
      customers: nearbyCustomers,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ========================================================
// 2. ค้นหาจากส่วนหนึ่งของชื่อ, นามสกุล
// GET /api/customers/search?name=พลอย
// ========================================================
router.get("/search", async (req: Request, res: Response) => {
  try {
    const query = String(req.query.name || req.query.q || "").trim();
    if (!query) {
      return res.status(400).json({ error: "กรุณาระบุคำค้นหา ?name=..." });
    }

    const customers = await prisma.customer.findMany({
      where: {
        name: {
          contains: query,
        },
      },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { id: "asc" },
    });

    res.json({
      query,
      count: customers.length,
      customers,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ========================================================
// 3. แสดงข้อมูลลูกค้าทุกคน (รองรับ ?search=...)
// GET /api/customers
// ========================================================
router.get("/", async (req: Request, res: Response) => {
  try {
    const search = req.query.search || req.query.name;
    const whereClause = search
      ? {
          name: {
            contains: String(search).trim(),
          },
        }
      : {};

    const customers = await prisma.customer.findMany({
      where: whereClause,
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { orders: true } },
      },
      orderBy: { id: "desc" },
    });

    res.json({
      count: customers.length,
      customers,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ========================================================
// 4. แสดงข้อมูลลูกค้ารายคนตาม ID
// GET /api/customers/:id
// ========================================================
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || !Number.isInteger(id)) {
      return res.status(400).json({ error: "ID ลูกค้าต้องเป็นตัวเลขจำนวนเต็มที่ถูกต้อง" });
    }

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ error: `ไม่พบข้อมูลลูกค้า ID ${id}` });
    }

    res.json(customer);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ========================================================
// 5. เพิ่มลูกค้าใหม่
// POST /api/customers
// ========================================================
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, phone, addressDetail, latitude, longitude } = req.body;

    if (!name || !phone || !addressDetail || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        error: "กรุณาระบุข้อมูลให้ครบถ้วน: name, phone, addressDetail, latitude, longitude",
      });
    }

    const lat = parseFloat(String(latitude));
    const lng = parseFloat(String(longitude));

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: "พิกัด latitude และ longitude ต้องเป็นตัวเลข" });
    }

    const newCustomer = await prisma.customer.create({
      data: {
        name: String(name).trim(),
        phone: String(phone).trim(),
        addressDetail: String(addressDetail).trim(),
        latitude: lat,
        longitude: lng,
      },
    });

    res.status(201).json({
      message: "เพิ่มข้อมูลลูกค้าสำเร็จ",
      customer: newCustomer,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ========================================================
// 6. แก้ไขข้อมูลลูกค้า
// PUT / PATCH /api/customers/:id
// ========================================================
const updateCustomerHandler = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || !Number.isInteger(id)) {
      return res.status(400).json({ error: "ID ลูกค้าต้องเป็นตัวเลขจำนวนเต็มที่ถูกต้อง" });
    }

    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: `ไม่พบข้อมูลลูกค้า ID ${id}` });
    }

    const { name, phone, addressDetail, latitude, longitude } = req.body;
    const updateData: any = {};

    if (name !== undefined) updateData.name = String(name).trim();
    if (phone !== undefined) updateData.phone = String(phone).trim();
    if (addressDetail !== undefined) updateData.addressDetail = String(addressDetail).trim();

    if (latitude !== undefined) {
      const lat = parseFloat(String(latitude));
      if (isNaN(lat)) return res.status(400).json({ error: "พิกัด latitude ต้องเป็นตัวเลข" });
      updateData.latitude = lat;
    }

    if (longitude !== undefined) {
      const lng = parseFloat(String(longitude));
      if (isNaN(lng)) return res.status(400).json({ error: "พิกัด longitude ต้องเป็นตัวเลข" });
      updateData.longitude = lng;
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: updateData,
    });

    res.json({
      message: "แก้ไขข้อมูลลูกค้าสำเร็จ",
      customer: updated,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

router.put("/:id", updateCustomerHandler);
router.patch("/:id", updateCustomerHandler);

// ========================================================
// 7. ลบลูกค้า
// DELETE /api/customers/:id
// ========================================================
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || !Number.isInteger(id)) {
      return res.status(400).json({ error: "ID ลูกค้าต้องเป็นตัวเลขจำนวนเต็มที่ถูกต้อง" });
    }

    const existing = await prisma.customer.findUnique({
      where: { id },
      include: { orders: true },
    });

    if (!existing) {
      return res.status(404).json({ error: `ไม่พบข้อมูลลูกค้า ID ${id}` });
    }

    const orderIds = (existing.orders as any[]).map((o: any) => o.id);
    if (orderIds.length > 0) {
      // ลบ task_items ที่ผูกกับ order ก่อน (ถ้ามี) เพื่อหลีกเลี่ยง foreign key violation
      await prisma.taskItem.deleteMany({
        where: { orderId: { in: orderIds } },
      }).catch(() => {});

      await prisma.order.deleteMany({
        where: { customerId: id },
      });
    }

    await prisma.customer.delete({
      where: { id },
    });

    res.json({
      message: `ลบลูกค้า ${existing.name} (ID: ${id}) เรียบร้อยแล้ว`,
      deletedCustomerId: id,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

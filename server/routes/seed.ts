import { RequestHandler } from "express";
import { saveDonationToCSV, saveRequestToCSV, generateId, DonationCSV, RequestCSV } from "../utils/csvUtils";

// Seed test data (POST /api/seed) - For testing purposes
export const seedTestData: RequestHandler = (req: any, res) => {
  try {
    const now = new Date().toISOString();
    
    // Sample donations
    const sampleDonations: DonationCSV[] = [
      {
        id: generateId(),
        donorId: 'donor1',
        donorName: 'John Doe',
        donorEmail: 'john@example.com',
        itemName: 'Winter Clothes',
        category: 'clothes',
        description: 'Warm winter jackets, sweaters, and pants for children ages 5-12',
        quantity: 20,
        photoUrl: '',
        status: 'approved',
        createdAt: now,
        updatedAt: now
      },
      {
        id: generateId(),
        donorId: 'donor2',
        donorName: 'Jane Smith',
        donorEmail: 'jane@example.com',
        itemName: 'Rice and Lentils',
        category: 'food',
        description: '50kg of rice and 20kg of lentils for families in need',
        quantity: 70,
        photoUrl: '',
        status: 'approved',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: generateId(),
        donorId: 'donor3',
        donorName: 'Medical Center',
        donorEmail: 'medical@example.com',
        itemName: 'Medical Supplies',
        category: 'medical',
        description: 'First aid kits, bandages, and basic medicines',
        quantity: 15,
        photoUrl: '',
        status: 'approved',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        updatedAt: new Date(Date.now() - 172800000).toISOString()
      },
      {
        id: generateId(),
        donorId: 'donor4',
        donorName: 'Tech Company',
        donorEmail: 'tech@example.com',
        itemName: 'Laptops',
        category: 'electronics',
        description: 'Refurbished laptops for students and educational purposes',
        quantity: 5,
        photoUrl: '',
        status: 'approved',
        createdAt: new Date(Date.now() - 259200000).toISOString(),
        updatedAt: new Date(Date.now() - 259200000).toISOString()
      },
      {
        id: generateId(),
        donorId: 'donor5',
        donorName: 'Book Lover',
        donorEmail: 'books@example.com',
        itemName: 'Educational Books',
        category: 'books',
        description: 'Textbooks and reference books for high school students',
        quantity: 50,
        photoUrl: '',
        status: 'approved',
        createdAt: new Date(Date.now() - 345600000).toISOString(),
        updatedAt: new Date(Date.now() - 345600000).toISOString()
      }
    ];

    // Sample requests
    const sampleRequests: RequestCSV[] = [
      {
        id: generateId(),
        receiverId: 'receiver1',
        receiverName: 'Maria Garcia',
        receiverEmail: 'maria@example.com',
        itemNeeded: 'School Supplies',
        category: 'books',
        description: 'Notebooks, pens, pencils for 3 children starting school',
        quantity: 30,
        urgency: 'urgent',
        status: 'approved',
        createdAt: now,
        updatedAt: now
      },
      {
        id: generateId(),
        receiverId: 'receiver2',
        receiverName: 'Ahmed Ali',
        receiverEmail: 'ahmed@example.com',
        itemNeeded: 'Baby Formula',
        category: 'food',
        description: 'Infant formula for 6-month-old baby - lactose-free if possible',
        quantity: 10,
        urgency: 'urgent',
        status: 'approved',
        createdAt: new Date(Date.now() - 43200000).toISOString(),
        updatedAt: new Date(Date.now() - 43200000).toISOString()
      },
      {
        id: generateId(),
        receiverId: 'receiver3',
        receiverName: 'Chen Wei',
        receiverEmail: 'chen@example.com',
        itemNeeded: 'Blankets',
        category: 'clothes',
        description: 'Warm blankets for elderly family members during winter',
        quantity: 5,
        urgency: 'normal',
        status: 'approved',
        createdAt: new Date(Date.now() - 129600000).toISOString(),
        updatedAt: new Date(Date.now() - 129600000).toISOString()
      },
      {
        id: generateId(),
        receiverId: 'receiver4',
        receiverName: 'Local Clinic',
        receiverEmail: 'clinic@example.com',
        itemNeeded: 'Blood Pressure Monitor',
        category: 'medical',
        description: 'Digital blood pressure monitor for community health checks',
        quantity: 2,
        urgency: 'normal',
        status: 'approved',
        createdAt: new Date(Date.now() - 216000000).toISOString(),
        updatedAt: new Date(Date.now() - 216000000).toISOString()
      },
      {
        id: generateId(),
        receiverId: 'receiver5',
        receiverName: 'Single Parent',
        receiverEmail: 'parent@example.com',
        itemNeeded: 'Children Toys',
        category: 'toys',
        description: 'Educational toys for 2 children ages 3 and 5',
        quantity: 8,
        urgency: 'normal',
        status: 'approved',
        createdAt: new Date(Date.now() - 302400000).toISOString(),
        updatedAt: new Date(Date.now() - 302400000).toISOString()
      }
    ];

    // Save sample data to CSV files
    sampleDonations.forEach(donation => {
      saveDonationToCSV(donation);
    });

    sampleRequests.forEach(request => {
      saveRequestToCSV(request);
    });

    res.json({
      success: true,
      message: `Seeded ${sampleDonations.length} donations and ${sampleRequests.length} requests to CSV files.`,
      data: {
        donations: sampleDonations.length,
        requests: sampleRequests.length
      }
    });
  } catch (error) {
    console.error("Seed data error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to seed test data." 
    });
  }
};

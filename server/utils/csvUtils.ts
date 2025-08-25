import fs from 'fs';
import path from 'path';

// CSV file paths
const DATA_DIR = path.join(process.cwd(), 'data');
const DONATIONS_CSV = path.join(DATA_DIR, 'donations.csv');
const REQUESTS_CSV = path.join(DATA_DIR, 'requests.csv');

// Ensure data directory exists
export function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Initialize CSV files with headers if they don't exist
export function initializeCSVFiles() {
  ensureDataDirectory();
  
  // Initialize donations.csv
  if (!fs.existsSync(DONATIONS_CSV)) {
    const donationsHeader = 'id,donorId,donorName,donorEmail,itemName,category,description,quantity,photoUrl,status,createdAt,updatedAt\n';
    fs.writeFileSync(DONATIONS_CSV, donationsHeader);
  }
  
  // Initialize requests.csv
  if (!fs.existsSync(REQUESTS_CSV)) {
    const requestsHeader = 'id,receiverId,receiverName,receiverEmail,itemNeeded,category,description,quantity,urgency,status,createdAt,updatedAt\n';
    fs.writeFileSync(REQUESTS_CSV, requestsHeader);
  }
}

// Generate unique ID
export function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// Convert object to CSV row
function objectToCSVRow(obj: any): string {
  const values = Object.values(obj).map(value => {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  });
  return values.join(',') + '\n';
}

// Convert CSV row to object
function csvRowToObject(row: string, headers: string[]): any {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < row.length) {
    const char = row[i];
    
    if (char === '"' && !inQuotes) {
      inQuotes = true;
    } else if (char === '"' && inQuotes) {
      if (row[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = false;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
    i++;
  }
  values.push(current); // Add last value
  
  const obj: any = {};
  headers.forEach((header, index) => {
    obj[header] = values[index] || '';
  });
  
  return obj;
}

// Save donation to CSV
export interface DonationCSV {
  id: string;
  donorId: string;
  donorName: string;
  donorEmail: string;
  itemName: string;
  category: string;
  description: string;
  quantity: number;
  photoUrl: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export function saveDonationToCSV(donation: DonationCSV): void {
  initializeCSVFiles();
  const csvRow = objectToCSVRow(donation);
  fs.appendFileSync(DONATIONS_CSV, csvRow);
}

// Save request to CSV
export interface RequestCSV {
  id: string;
  receiverId: string;
  receiverName: string;
  receiverEmail: string;
  itemNeeded: string;
  category: string;
  description: string;
  quantity: number;
  urgency: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export function saveRequestToCSV(request: RequestCSV): void {
  initializeCSVFiles();
  const csvRow = objectToCSVRow(request);
  fs.appendFileSync(REQUESTS_CSV, csvRow);
}

// Read all donations from CSV
export function readDonationsFromCSV(): DonationCSV[] {
  initializeCSVFiles();
  
  if (!fs.existsSync(DONATIONS_CSV)) {
    return [];
  }
  
  const csvContent = fs.readFileSync(DONATIONS_CSV, 'utf-8');
  const lines = csvContent.trim().split('\n');
  
  if (lines.length <= 1) {
    return []; // Only header or empty file
  }
  
  const headers = lines[0].split(',');
  const donations: DonationCSV[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim()) {
      try {
        const donation = csvRowToObject(lines[i], headers) as DonationCSV;
        donation.quantity = parseInt(donation.quantity.toString()) || 0;
        donations.push(donation);
      } catch (error) {
        console.error('Error parsing donation row:', lines[i], error);
      }
    }
  }
  
  return donations;
}

// Read all requests from CSV
export function readRequestsFromCSV(): RequestCSV[] {
  initializeCSVFiles();
  
  if (!fs.existsSync(REQUESTS_CSV)) {
    return [];
  }
  
  const csvContent = fs.readFileSync(REQUESTS_CSV, 'utf-8');
  const lines = csvContent.trim().split('\n');
  
  if (lines.length <= 1) {
    return []; // Only header or empty file
  }
  
  const headers = lines[0].split(',');
  const requests: RequestCSV[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim()) {
      try {
        const request = csvRowToObject(lines[i], headers) as RequestCSV;
        request.quantity = parseInt(request.quantity.toString()) || 0;
        requests.push(request);
      } catch (error) {
        console.error('Error parsing request row:', lines[i], error);
      }
    }
  }
  
  return requests;
}

// Update donation in CSV
export function updateDonationInCSV(donationId: string, updates: Partial<DonationCSV>): boolean {
  const donations = readDonationsFromCSV();
  const index = donations.findIndex(d => d.id === donationId);
  
  if (index === -1) {
    return false;
  }
  
  donations[index] = { ...donations[index], ...updates, updatedAt: new Date().toISOString() };
  
  // Rewrite entire file
  initializeCSVFiles();
  const header = 'id,donorId,donorName,donorEmail,itemName,category,description,quantity,photoUrl,status,createdAt,updatedAt\n';
  let csvContent = header;
  
  donations.forEach(donation => {
    csvContent += objectToCSVRow(donation);
  });
  
  fs.writeFileSync(DONATIONS_CSV, csvContent);
  return true;
}

// Update request in CSV
export function updateRequestInCSV(requestId: string, updates: Partial<RequestCSV>): boolean {
  const requests = readRequestsFromCSV();
  const index = requests.findIndex(r => r.id === requestId);
  
  if (index === -1) {
    return false;
  }
  
  requests[index] = { ...requests[index], ...updates, updatedAt: new Date().toISOString() };
  
  // Rewrite entire file
  initializeCSVFiles();
  const header = 'id,receiverId,receiverName,receiverEmail,itemNeeded,category,description,quantity,urgency,status,createdAt,updatedAt\n';
  let csvContent = header;
  
  requests.forEach(request => {
    csvContent += objectToCSVRow(request);
  });
  
  fs.writeFileSync(REQUESTS_CSV, csvContent);
  return true;
}

// Delete donation from CSV
export function deleteDonationFromCSV(donationId: string): boolean {
  const donations = readDonationsFromCSV();
  const filteredDonations = donations.filter(d => d.id !== donationId);
  
  if (filteredDonations.length === donations.length) {
    return false; // Not found
  }
  
  // Rewrite entire file
  initializeCSVFiles();
  const header = 'id,donorId,donorName,donorEmail,itemName,category,description,quantity,photoUrl,status,createdAt,updatedAt\n';
  let csvContent = header;
  
  filteredDonations.forEach(donation => {
    csvContent += objectToCSVRow(donation);
  });
  
  fs.writeFileSync(DONATIONS_CSV, csvContent);
  return true;
}

// Delete request from CSV
export function deleteRequestFromCSV(requestId: string): boolean {
  const requests = readRequestsFromCSV();
  const filteredRequests = requests.filter(r => r.id !== requestId);
  
  if (filteredRequests.length === requests.length) {
    return false; // Not found
  }
  
  // Rewrite entire file
  initializeCSVFiles();
  const header = 'id,receiverId,receiverName,receiverEmail,itemNeeded,category,description,quantity,urgency,status,createdAt,updatedAt\n';
  let csvContent = header;
  
  filteredRequests.forEach(request => {
    csvContent += objectToCSVRow(request);
  });
  
  fs.writeFileSync(REQUESTS_CSV, csvContent);
  return true;
}

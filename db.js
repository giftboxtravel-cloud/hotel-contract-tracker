// db.js - Database Module for Hotel Contract Rate Tracker
// Supports IndexedDB (Local Offline) and Supabase (Cloud Online Sync)

const DB_NAME = 'HotelContractRatesDB';
const DB_VERSION = 1;

let dbInstance = null;
let supabaseClient = null;

// Initialize the Database
function initDB() {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('IndexedDB open error:', event.target.error);
      reject('Failed to open database: ' + event.target.error);
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // 1. Locations Store
      if (!db.objectStoreNames.contains('locations')) {
        db.createObjectStore('locations', { keyPath: 'id' });
      }

      // 2. Hotels Store
      if (!db.objectStoreNames.contains('hotels')) {
        db.createObjectStore('hotels', { keyPath: 'id' });
      }

      // 3. Contracts Store
      if (!db.objectStoreNames.contains('contracts')) {
        db.createObjectStore('contracts', { keyPath: 'id' });
      }

      // 4. Settings Store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'id' });
      }
    };
  });
}

// Supabase Client Management
function initSupabase(url, key) {
  if (url && key && window.supabase) {
    try {
      supabaseClient = window.supabase.createClient(url, key);
      console.log('Supabase client initialized successfully!');
      return true;
    } catch (e) {
      console.error('Failed to initialize Supabase client:', e);
      supabaseClient = null;
      return false;
    }
  }
  supabaseClient = null;
  return false;
}

function isCloudEnabled() {
  return supabaseClient !== null;
}

// Test Supabase connection
async function testSupabaseConnection(url, key) {
  if (!url || !key || !window.supabase) return false;
  try {
    const tempClient = window.supabase.createClient(url, key);
    // Try querying a simple table or settings
    const { data, error } = await tempClient.from('locations').select('id').limit(1);
    if (error) {
      // If table doesn't exist yet, but authentication passes, it still means API is valid
      if (error.code === '42P01') { // undefined_table error
        console.warn('Supabase URL/Key are valid, but tables do not exist yet. Run SQL setup script.');
        return 'TABLES_MISSING';
      }
      throw error;
    }
    return 'CONNECTED';
  } catch (err) {
    console.error('Supabase connection test failed:', err);
    return 'ERROR';
  }
}

// หากต้องการให้โปรแกรมเชื่อมต่อฐานข้อมูล Supabase อัตโนมัติสำหรับทีมงานที่แชร์ผ่าน OneDrive
// ให้กรอก Project URL และ Anon Key ของคุณลงในตัวแปรตรงนี้ได้เลย (เพื่อให้ทุกคนที่แชร์ไฟล์ไปใช้ใช้งานได้ทันทีโดยไม่ต้องไปกรอกคีย์เองทีละเครื่อง)
const DEFAULT_SUPABASE_URL = 'https://cdufyjctkyruxyvyuwgl.supabase.co';
const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkdWZ5amN0a3lydXh5dnl1d2dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NDM3ODYsImV4cCI6MjA5NjIxOTc4Nn0.CW7qUvlBw6ucPXmcyj1vkhDC-sXvxNN0UGQSIAf3mDo'; 

// Auto-initialize Supabase on load if keys exist

const savedSupabaseUrl =
    localStorage.getItem('supabase_url') || DEFAULT_SUPABASE_URL;

const savedSupabaseKey =
    localStorage.getItem('supabase_anon_key') || DEFAULT_SUPABASE_KEY;

if (savedSupabaseUrl && savedSupabaseKey) {
    initSupabase(savedSupabaseUrl, savedSupabaseKey);
}

// Generic database operations helper for IndexedDB
function getStore(storeName, mode = 'readonly') {
  return initDB().then((db) => {
    const transaction = db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  });
}

// Retrieve single item (Supabase fallback to IndexedDB)
async function getItem(storeName, key) {
  if (isCloudEnabled()) {
    try {
      const { data, error } = await supabaseClient
        .from(storeName)
        .select('*')
        .eq('id', key)
        .maybeSingle();
      
      if (!error && data) {
        return data;
      }
      if (error) console.warn(`Supabase getItem error on ${storeName}:`, error);
    } catch (e) {
      console.warn(`Supabase network/request failed on getItem:`, e);
    }
  }
  
  // Local Fallback
  return new Promise((resolve, reject) => {
    getStore(storeName)
      .then((store) => {
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      })
      .catch(reject);
  });
}

// Retrieve all items (Supabase fallback to IndexedDB)
async function getAllItems(storeName) {
  if (isCloudEnabled()) {
    try {
      const { data, error } = await supabaseClient
        .from(storeName)
        .select('*');
      
      if (!error && data) {
        return data;
      }
      if (error) console.warn(`Supabase getAllItems error on ${storeName}:`, error);
    } catch (e) {
      console.warn(`Supabase network/request failed on getAllItems:`, e);
    }
  }

  // Local Fallback
  return new Promise((resolve, reject) => {
    getStore(storeName)
      .then((store) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      })
      .catch(reject);
  });
}

// Save/Update item (Writes to both IndexedDB and Supabase if active)
async function putItem(storeName, data) {
  // Always write locally to IndexedDB first
  await new Promise((resolve, reject) => {
    getStore(storeName, 'readwrite')
      .then((store) => {
        const request = store.put(data);
        request.onsuccess = () => resolve(data);
        request.onerror = () => reject(request.error);
      })
      .catch(reject);
  });

  // Write online if connected
  if (isCloudEnabled()) {
    try {
      const { error } = await supabaseClient
        .from(storeName)
        .upsert(data);
      
      if (error) {
        console.error(`Supabase write error on ${storeName}:`, error);
        throw error;
      }
    } catch (e) {
      console.warn(`Supabase write failed (will remain local only for now):`, e);
    }
  }

  return data;
}

// Delete item (Deletes from both IndexedDB and Supabase if active)
async function deleteItem(storeName, key) {
  // Always delete locally first
  await new Promise((resolve, reject) => {
    getStore(storeName, 'readwrite')
      .then((store) => {
        const request = store.delete(key);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      })
      .catch(reject);
  });

  // Delete online if connected
  if (isCloudEnabled()) {
    try {
      const { error } = await supabaseClient
        .from(storeName)
        .delete()
        .eq('id', key);
      
      if (error) {
        console.error(`Supabase delete error on ${storeName}:`, error);
        throw error;
      }
    } catch (e) {
      console.warn(`Supabase delete failed on cloud:`, e);
    }
  }

  return true;
}

// Clear local IndexedDB store
function clearStore(storeName) {
  return new Promise((resolve, reject) => {
    getStore(storeName, 'readwrite')
      .then((store) => {
        const request = store.clear();
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      })
      .catch(reject);
  });
}

// Seed Initial Sample Data locally if empty
async function seedInitialData() {
  const locations = await getAllItems('locations');
  if (locations.length > 0) return; // DB already has data

  console.log('Seeding initial local data to IndexedDB...');

  // 1. Seed Locations
  const sampleLocations = [
    { id: 'loc-1', province: 'กระบี่', area: 'อ่าวนาง' },
    { id: 'loc-2', province: 'กระบี่', area: 'คลองม่วง' },
    { id: 'loc-3', province: 'ภูเก็ต', area: 'ป่าตอง' },
    { id: 'loc-4', province: 'ภูเก็ต', area: 'กะตะ' },
    { id: 'loc-5', province: 'สุราษฎร์ธานี', area: 'เกาะสมุย' },
    { id: 'loc-6', province: 'สุราษฎร์ธานี', area: 'เกาะพะงัน' }
  ];
  for (const loc of sampleLocations) {
    await putItem('locations', loc);
  }

  // 2. Seed Hotels
  const sampleHotels = [
    { id: 'hotel-1', name: 'อ่าวนาง คลิฟ บีช รีสอร์ท', stars: 4, province: 'กระบี่', area: 'อ่าวนาง', email: 'sales@aonangcliffbeach.com', cc: 'rsvn@aonangcliffbeach.com, gm@aonangcliffbeach.com', lineId: '@aonangcliff' },
    { id: 'hotel-2', name: 'ดุสิตธานี กระบี่ บีช รีสอร์ท', stars: 5, province: 'กระบี่', area: 'คลองม่วง', email: 'sales.krabi@dusit.com', cc: 'sales-admin@dusit.com', lineId: '' },
    { id: 'hotel-3', name: 'คลองม่วง ซันเซ็ต เฮ้าส์', stars: 3, province: 'กระบี่', area: 'คลองม่วง', email: 'krabiklongmuangsunset@gmail.com', cc: '', lineId: 'sunsetline' },
    { id: 'hotel-4', name: 'ป่าตอง เมอร์ลิน โฮเต็ล', stars: 4, province: 'ภูเก็ต', area: 'ป่าตอง', email: 'sales@patongmerlin.com', cc: 'info@patongmerlin.com', lineId: '@patongmerlin' },
    { id: 'hotel-5', name: 'กะตะ พาเลส ภูเก็ต', stars: 3, province: 'ภูเก็ต', area: 'กะตะ', email: 'sales@katapalacephuket.com', cc: '', lineId: '' },
    { id: 'hotel-6', name: 'ศิลาวดี พูล สปา รีสอร์ท', stars: 5, province: 'สุราษฎร์ธานี', area: 'เกาะสมุย', email: 'sales@silavadiresort.com', cc: 'rsvn@silavadiresort.com', lineId: '@silavadisales' }
  ];
  for (const hotel of sampleHotels) {
    await putItem('hotels', hotel);
  }

  // 3. Seed Contracts (Note: Current date mock is 2026-06-05)
  const sampleContracts = [
    {
      id: 'contract-1a',
      hotelId: 'hotel-1',
      type: 'main',

      startDate: '2026-01-01',
      endDate: '2026-12-31',

      stayStartDate: '2026-01-01',
      stayEndDate: '2026-12-31',

      baseRate: 2500,
      fileName: 'main_contract_aonang_cliff_2026.pdf',
      fileData: 'data:application/pdf;base64,JVBERi0xLjQKJdPr6gogMSAwIG9iagogIDw8IC9UeXBlIC9DYXRhbG9nIC9QYWdlcyAyIDAgUiA+PiBlbmRvYmoKMiAwIG9iagogIDw8IC9UeXBlIC9QYWdlcyAvS2lkcyBbIDMgMCBSIF0gL0NvdW50IDEgPj4gZW5kb2JqCjMgMCBvYmogCiAgPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWyAwIDAgNTk1IDg0MiBdID4+IGVuZG9iagp0cmFpbGVyCiAgPDwgL1NpemUgNCAvUm9vdCAxIDAgUiA+PgolJUVPRgo=',
      fileType: 'application/pdf',
      status: 'Active'
    },
    {
      id: 'contract-1b',
      hotelId: 'hotel-1',
      type: 'promo',

      startDate: '2026-05-01',
      endDate: '2026-06-10',

      stayStartDate: '2026-06-15',
      stayEndDate: '2026-10-31',

      baseRate: 1800,
      fileName: 'promo_green_season_aonang.pdf',
      fileData: 'data:application/pdf;base64,JVBERi0xLjQKJdPr6gogMSAwIG9iagogIDw8IC9UeXBlIC9DYXRhbG9nIC9QYWdlcyAyIDAgUiA+PiBlbmRvYmoKMiAwIG9iagogIDw8IC9UeXBlIC9QYWdlcyAvS2lkcyBbIDMgMCBSIF0gL0NvdW50IDEgPj4gZW5kb2JqCjMgMCBvYmogCiAgPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWyAwIDAgNTk1IDg0MiBdID4+IGVuZG9iagp0cmFpbGVyCiAgPDwgL1NpemUgNCAvUm9vdCAxIDAgUiA+PgolJUVPRgo=',
      fileType: 'application/pdf',
      status: 'Active'
    },
    {
      id: 'contract-2a',
      hotelId: 'hotel-2',
      type: 'main',
      startDate: '2025-07-01',
      endDate: '2026-06-30',
      baseRate: 4800,
      fileName: 'dusit_krabi_main_25_26.pdf',
      fileData: 'data:application/pdf;base64,JVBERi0xLjQKJdPr6gogMSAwIG9iagogIDw8IC9UeXBlIC9DYXRhbG9nIC9QYWdlcyAyIDAgUiA+PiBlbmRvYmoKMiAwIG9iagogIDw8IC9UeXBlIC9QYWdlcyAvS2lkcyBbIDMgMCBSIF0gL0NvdW50IDEgPj4gZW5kb2JqCjMgMCBvYmogCiAgPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWyAwIDAgNTk1IDg0MiBdID4+IGVuZG9iagp0cmFpbGVyCiAgPDwgL1NpemUgNCAvUm9vdCAxIDAgUiA+PgolJUVPRgo=',
      fileType: 'application/pdf',
      status: 'Active'
    },
    {
      id: 'contract-3a',
      hotelId: 'hotel-3',
      type: 'main',
      startDate: '2025-05-01',
      endDate: '2026-04-30',
      baseRate: 1100,
      fileName: 'klong_muang_sunset_main.png',
      fileData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      fileType: 'image/png',
      status: 'Expired'
    },
    {
      id: 'contract-4a',
      hotelId: 'hotel-4',
      type: 'main',
      startDate: '2025-12-01',
      endDate: '2026-11-30',
      baseRate: 3100,
      fileName: 'patong_merlin_2526.pdf',
      fileData: 'data:application/pdf;base64,JVBERi0xLjQKJdPr6gogMSAwIG9iagogIDw8IC9UeXBlIC9DYXRhbG9nIC9QYWdlcyAyIDAgUiA+PiBlbmRvYmoKMiAwIG9iagogIDw8IC9UeXBlIC9QYWdlcyAvS2lkcyBbIDMgMCBSIF0gL0NvdW50IDEgPj4gZW5kb2JqCjMgMCBvYmogCiAgPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWyAwIDAgNTk1IDg0MiBdID4+IGVuZG9iagp0cmFpbGVyCiAgPDwgL1NpemUgNCAvUm9vdCAxIDAgUiA+PgolJUVPRgo=',
      fileType: 'application/pdf',
      status: 'Active'
    },
    {
      id: 'contract-4b',
      hotelId: 'hotel-4',
      type: 'promo',
      startDate: '2026-06-01',
      endDate: '2026-08-31',
      baseRate: 2300,
      fileName: 'patong_merlin_flash_sale.pdf',
      fileData: 'data:application/pdf;base64,JVBERi0xLjQKJdPr6gogMSAwIG9iagogIDw8IC9UeXBlIC9DYXRhbG9nIC9QYWdlcyAyIDAgUiA+PiBlbmRvYmoKMiAwIG9iagogIDw8IC9UeXBlIC9QYWdlcyAvS2lkcyBbIDMgMCBSIF0gL0NvdW50IDEgPj4gZW5kb2JqCjMgMCBvYmogCiAgPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWyAwIDAgNTk1IDg0MiBdID4+IGVuZG9iagp0cmFpbGVyCiAgPDwgL1NpemUgNCAvUm9vdCAxIDAgUiA+PgolJUVPRgo=',
      fileType: 'application/pdf',
      status: 'Active'
    },
    {
      id: 'contract-5a',
      hotelId: 'hotel-5',
      type: 'main',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      baseRate: 1500,
      fileName: 'kata_palace_contract_2026.pdf',
      fileData: 'data:application/pdf;base64,JVBERi0xLjQKJdPr6gogMSAwIG9iagogIDw8IC9UeXBlIC9DYXRhbG9nIC9QYWdlcyAyIDAgUiA+PiBlbmRvYmoKMiAwIG9iagogIDw8IC9UeXBlIC9QYWdlcyAvS2lkcyBbIDMgMCBSIF0gL0NvdW50IDEgPj4gZW5kb2JqCjMgMCBvYmogCiAgPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWyAwIDAgNTk1IDg0MiBdID4+IGVuZG9iagp0cmFpbGVyCiAgPDwgL1NpemUgNCAvUm9vdCAxIDAgUiA+PgolJUVPRgo=',
      fileType: 'application/pdf',
      status: 'Active'
    },
    {
      id: 'contract-6a',
      hotelId: 'hotel-6',
      type: 'main',
      startDate: '2025-10-01',
      endDate: '2026-09-30',
      baseRate: 8500,
      fileName: 'silavadee_main_25_26.pdf',
      fileData: 'data:application/pdf;base64,JVBERi0xLjQKJdPr6gogMSAwIG9iagogIDw8IC9UeXBlIC9DYXRhbG9nIC9QYWdlcyAyIDAgUiA+PiBlbmRvYmoKMiAwIG9iagogIDw8IC9UeXBlIC9QYWdlcyAvS2lkcyBbIDMgMCBSIF0gL0NvdW50IDEgPj4gZW5kb2JqCjMgMCBvYmogCiAgPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWyAwIDAgNTk1IDg0MiBdID4+IGVuZG9iagp0cmFpbGVyCiAgPDwgL1NpemUgNCAvUm9vdCAxIDAgUiA+PgolJUVPRgo=',
      fileType: 'application/pdf',
      status: 'Active'
    },
    {
      id: 'contract-6b',
      hotelId: 'hotel-6',
      type: 'promo',
      startDate: '2026-05-01',
      endDate: '2026-07-31',
      baseRate: 6900,
      fileName: 'silavadee_early_bird.pdf',
      fileData: 'data:application/pdf;base64,JVBERi0xLjQKJdPr6gogMSAwIG9iagogIDw8IC9UeXBlIC9DYXRhbG9nIC9QYWdlcyAyIDAgUiA+PiBlbmRvYmoKMiAwIG9iagogIDw8IC9UeXBlIC9QYWdlcyAvS2lkcyBbIDMgMCBSIF0gL0NvdW50IDEgPj4gZW5kb2JqCjMgMCBvYmogCiAgPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWyAwIDAgNTk1IDg0MiBdID4+IGVuZG9iagp0cmFpbGVyCiAgPDwgL1NpemUgNCAvUm9vdCAxIDAgUiA+PgolJUVPRgo=',
      fileType: 'application/pdf',
      status: 'Active'
    }
  ];
  for (const contract of sampleContracts) {
    await putItem('contracts', contract);
  }

  // 4. Seed Settings
  const defaultSettings = {
    id: 'company_settings',
    companyName: 'บริษัท เที่ยวไทย จำกัด (Thai Travel Agency Co., Ltd.)',
    travelAgentLicense: '11/09999',
    emailTemplate: `เรียน ทีมงานฝ่ายขาย {hotelName},\n\nเนื่องด้วยสัญญาอัตราห้องพัก (Contract Rates) ในนาม {companyName} กำลังจะสิ้นสุดลงในไม่ช้านี้\n\nทางบริษัทใคร่ขอความอนุเคราะห์จากท่านเพื่อขอต่อสัญญาฉบับใหม่ สำหรับช่วงสัญญาถัดไป โดยแนบราคาสัญญาหลัก (Main Contract Rate) รวมถึงราคาโปรโมชั่น (Promotion Rates) เพิ่มเติมเพื่อความร่วมมือทางธุรกิจอย่างต่อเนื่อง\n\nทางเราได้แนบเอกสารแนะนำบริษัท (Company Profile) และใบอนุญาตประกอบธุรกิจนำเที่ยวมาพร้อมกับอีเมลฉบับนี้เพื่ออ้างอิงและตรวจสอบข้อมูล\n\nขอแสดงความนับถือ,\nฝ่ายพัฒนาธุรกิจนำเที่ยว\n{companyName}\nใบอนุญาตนำเที่ยวเลขที่: {licenseNumber}`,
    companyDocs: [
      {
        name: 'thai_travel_agent_license.pdf',
        data: 'data:application/pdf;base64,JVBERi0xLjQKJdPr6gogMSAwIG9iagogIDw8IC9UeXBlIC9DYXRhbG9nIC9QYWdlcyAyIDAgUiA+PiBlbmRvYmoKMiAwIG9iagogIDw8IC9UeXBlIC9QYWdlcyAvS2lkcyBbIDMgMCBSIF0gL0NvdW50IDEgPj4gZW5kb2JqCjMgMCBvYmogCiAgPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWyAwIDAgNTk1IDg0MiBdID4+IGVuZG9iagp0cmFpbGVyCiAgPDwgL1NpemUgNCAvUm9vdCAxIDAgUiA+PgolJUVPRgo=',
        type: 'application/pdf'
      }
    ]
  };
  await putItem('settings', defaultSettings);

  console.log('IndexedDB seed complete!');
}

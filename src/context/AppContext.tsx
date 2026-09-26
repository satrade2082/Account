import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  ActiveTab,
  AppUser,
  BusinessProfile,
  Category,
  Customer,
  MovementType,
  PaymentRecord,
  PaymentStatus,
  POStatus,
  Product,
  PurchaseOrder,
  PurchaseOrderItem,
  SalesOrder,
  SalesOrderItem,
  SalesOrderStatus,
  StockMovement,
  UserRole,
  Vendor,
} from '../types';
import {
  initialBusinessProfile,
  initialCategories,
  initialCustomers,
  initialPayments,
  initialProducts,
  initialPurchaseOrders,
  initialSalesOrders,
  initialStockMovements,
  initialUsers,
  initialVendors,
} from '../data/initialData';


interface AppContextType {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  businessProfile: BusinessProfile;
  updateBusinessProfile: (updates: Partial<BusinessProfile>) => void;
  
  // Products & Categories
  products: Product[];
  categories: Category[];
  addProduct: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (
    productId: string,
    newStock: number,
    reason: string,
    type: MovementType,
    performedBy?: string
  ) => void;
  
  addCategory: (data: Omit<Category, 'id' | 'createdAt'>) => Category;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Vendors
  vendors: Vendor[];
  addVendor: (data: Omit<Vendor, 'id' | 'createdAt' | 'totalPurchases' | 'outstandingPayable'>) => Vendor;
  updateVendor: (id: string, updates: Partial<Vendor>) => void;
  deleteVendor: (id: string) => void;

  // Customers
  customers: Customer[];
  addCustomer: (data: Omit<Customer, 'id' | 'createdAt' | 'totalSales' | 'outstandingReceivable'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  // Purchases
  purchaseOrders: PurchaseOrder[];
  createPurchaseOrder: (data: {
    vendorId: string;
    orderDate: string;
    expectedDate?: string;
    items: PurchaseOrderItem[];
    shippingFee?: number;
    notes?: string;
    status?: POStatus;
    paidAmount?: number;
    paymentMethod?: string;
  }) => PurchaseOrder;
  receivePurchaseOrder: (poId: string, notes?: string) => void;
  updatePurchaseOrderStatus: (poId: string, status: POStatus) => void;
  deletePurchaseOrder: (poId: string, revertInventory?: boolean) => void;

  // Sales
  salesOrders: SalesOrder[];
  createSalesOrder: (data: {
    customerId: string;
    orderDate: string;
    dueDate?: string;
    items: {
      productId: string;
      quantity: number;
      unitPrice: number;
      taxRate: number;
      discount: number;
    }[];
    shippingFee?: number;
    paymentMethod?: 'Cash' | 'Card' | 'Bank Transfer' | 'UPI' | 'Store Credit' | 'Mixed';
    paidAmount?: number;
    notes?: string;
    status?: SalesOrderStatus;
  }) => { success: boolean; order?: SalesOrder; error?: string };
  updateSalesOrderStatus: (soId: string, status: SalesOrderStatus) => void;
  deleteSalesOrder: (soId: string, restoreInventory?: boolean) => void;

  // Stock Movements
  stockMovements: StockMovement[];

  // Payments & Financials
  payments: PaymentRecord[];
  deletePayment: (paymentId: string) => void;
  recordCustomerPayment: (params: {
    customerId: string;
    amount: number;
    paymentMethod: 'Cash' | 'Card' | 'Bank Transfer' | 'UPI' | 'Cheque' | 'Store Credit';
    referenceId?: string; // invoice number
    referenceNumber?: string;
    notes?: string;
    paymentDate?: string;
  }) => void;
  recordVendorPayment: (params: {
    vendorId: string;
    amount: number;
    paymentMethod: 'Cash' | 'Card' | 'Bank Transfer' | 'UPI' | 'Cheque' | 'Store Credit';
    referenceId?: string; // PO number
    referenceNumber?: string;
    notes?: string;
    paymentDate?: string;
  }) => void;

  // User Authentication & RBAC Control (Admin Controlled)
  users: AppUser[];
  currentUser: AppUser | null;
  login: (username: string, passwordOrPin: string) => { success: boolean; error?: string };
  logout: () => void;
  switchUser: (userId: string) => void;
  createUser: (data: Omit<AppUser, 'id' | 'createdAt' | 'lastLogin'>) => AppUser;
  updateUser: (id: string, updates: Partial<AppUser>) => void;
  deleteUser: (id: string) => { success: boolean; error?: string };
  resetUserPassword: (id: string, newPassword?: string, newPin?: string) => void;
  toggleUserStatus: (id: string) => void;
  canAccessTab: (tab: ActiveTab, user?: AppUser | null) => boolean;

  // System & Utilities
  resetToDefaultData: () => void;
  resetToDemoData: () => void;
  clearAllData: (preserveCategories?: boolean) => void;
  exportData: () => string;
  exportAllDataAsJSON: () => void;
  importData: (jsonStr: string) => boolean;
  importDataFromJSON: (jsonStr: string) => boolean;

  // Key Metrics
  metrics: {
    totalRevenue: number;
    totalPurchasesCost: number;
    grossProfit: number;
    grossMarginPercent: number;
    inventoryCostValue: number;
    inventoryRetailValue: number;
    totalProductsCount: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalReceivables: number;
    totalPayables: number;
    netCashflow: number;
    recentActivitiesCount: number;
  };

  // Quick modals / View state helper
  activeInvoiceForModal: SalesOrder | null;
  setActiveInvoiceForModal: (order: SalesOrder | null) => void;
  activePOForModal: PurchaseOrder | null;
  setActivePOForModal: (po: PurchaseOrder | null) => void;
}

const STORAGE_KEYS = {
  PROFILE: 'omnistock_nepal_business_profile_v2',
  PRODUCTS: 'omnistock_nepal_products_v2',
  CATEGORIES: 'omnistock_nepal_categories_v2',
  VENDORS: 'omnistock_nepal_vendors_v2',
  CUSTOMERS: 'omnistock_nepal_customers_v2',
  PURCHASES: 'omnistock_nepal_purchases_v2',
  SALES: 'omnistock_nepal_sales_v2',
  MOVEMENTS: 'omnistock_nepal_movements_v2',
  PAYMENTS: 'omnistock_nepal_payments_v2',
  USERS: 'omnistock_nepal_users_v2',
  CURRENT_USER: 'omnistock_nepal_current_user_v2',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [activeInvoiceForModal, setActiveInvoiceForModal] = useState<SalesOrder | null>(null);
  const [activePOForModal, setActivePOForModal] = useState<PurchaseOrder | null>(null);

  // Business Profile
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      return saved ? JSON.parse(saved) : initialBusinessProfile;
    } catch {
      return initialBusinessProfile;
    }
  });

  // Categories
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return saved ? JSON.parse(saved) : initialCategories;
    } catch {
      return initialCategories;
    }
  });

  // Products
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return saved ? JSON.parse(saved) : initialProducts;
    } catch {
      return initialProducts;
    }
  });

  // Vendors
  const [vendors, setVendors] = useState<Vendor[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.VENDORS);
      return saved ? JSON.parse(saved) : initialVendors;
    } catch {
      return initialVendors;
    }
  });

  // Customers
  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      return saved ? JSON.parse(saved) : initialCustomers;
    } catch {
      return initialCustomers;
    }
  });

  // Purchase Orders
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PURCHASES);
      return saved ? JSON.parse(saved) : initialPurchaseOrders;
    } catch {
      return initialPurchaseOrders;
    }
  });

  // Sales Orders
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SALES);
      return saved ? JSON.parse(saved) : initialSalesOrders;
    } catch {
      return initialSalesOrders;
    }
  });

  // Stock Movements
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
      return saved ? JSON.parse(saved) : initialStockMovements;
    } catch {
      return initialStockMovements;
    }
  });

  // Payments
  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
      return saved ? JSON.parse(saved) : initialPayments;
    } catch {
      return initialPayments;
    }
  });

  // Users & Authentication
  const [users, setUsers] = useState<AppUser[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      return saved ? JSON.parse(saved) : initialUsers;
    } catch {
      return initialUsers;
    }
  });

  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) return parsed;
      }
      return initialUsers[0]; // default logged in as admin
    } catch {
      return initialUsers[0];
    }
  });

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(businessProfile));
  }, [businessProfile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VENDORS, JSON.stringify(vendors));
  }, [vendors]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(salesOrders));
  }, [salesOrders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(stockMovements));
  }, [stockMovements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }, [currentUser]);


  // Profile update
  const updateBusinessProfile = (updates: Partial<BusinessProfile>) => {
    setBusinessProfile((prev) => ({ ...prev, ...updates }));
  };

  // Products CRUD
  const addProduct = (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product => {
    const id = `prod-${Date.now()}`;
    const now = new Date().toISOString().split('T')[0];
    const newProduct: Product = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };

    setProducts((prev) => [newProduct, ...prev]);

    if (newProduct.currentStock > 0) {
      const movement: StockMovement = {
        id: `mov-${Date.now()}`,
        productId: newProduct.id,
        productName: newProduct.name,
        sku: newProduct.sku,
        type: 'INITIAL_STOCK',
        quantityChange: newProduct.currentStock,
        previousStock: 0,
        newStock: newProduct.currentStock,
        referenceId: 'INIT-ENTRY',
        reason: 'Initial stock intake upon product registration',
        unitCost: newProduct.purchasePrice,
        performedBy: 'Inventory Manager',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      };
      setStockMovements((prev) => [movement, ...prev]);
    }

    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    const now = new Date().toISOString().split('T')[0];
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: now } : p))
    );
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const adjustStock = (
    productId: string,
    newStock: number,
    reason: string,
    type: MovementType,
    performedBy = 'Inventory Auditor'
  ) => {
    const target = products.find((p) => p.id === productId);
    if (!target) return;

    const prevStock = target.currentStock;
    const qtyChange = newStock - prevStock;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      productId: target.id,
      productName: target.name,
      sku: target.sku,
      type,
      quantityChange: qtyChange,
      previousStock: prevStock,
      newStock: newStock,
      referenceId: `ADJ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      reason: reason || 'Manual stock adjustment and reconciliation',
      performedBy,
      timestamp: now,
    };

    setStockMovements((prev) => [movement, ...prev]);
    updateProduct(productId, { currentStock: newStock });
  };

  // Categories CRUD
  const addCategory = (data: Omit<Category, 'id' | 'createdAt'>): Category => {
    const newCat: Category = {
      ...data,
      id: `cat-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setCategories((prev) => [...prev, newCat]);
    return newCat;
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  // Vendors CRUD
  const addVendor = (data: Omit<Vendor, 'id' | 'createdAt' | 'totalPurchases' | 'outstandingPayable'>): Vendor => {
    const newVendor: Vendor = {
      ...data,
      id: `ven-${Date.now()}`,
      totalPurchases: 0,
      outstandingPayable: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setVendors((prev) => [newVendor, ...prev]);
    return newVendor;
  };

  const updateVendor = (id: string, updates: Partial<Vendor>) => {
    setVendors((prev) => prev.map((v) => (v.id === id ? { ...v, ...updates } : v)));
  };

  const deleteVendor = (id: string) => {
    setVendors((prev) => prev.filter((v) => v.id !== id));
  };

  // Customers CRUD
  const addCustomer = (data: Omit<Customer, 'id' | 'createdAt' | 'totalSales' | 'outstandingReceivable'>): Customer => {
    const newCustomer: Customer = {
      ...data,
      id: `cust-${Date.now()}`,
      totalSales: 0,
      outstandingReceivable: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setCustomers((prev) => [newCustomer, ...prev]);
    return newCustomer;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  // Purchases
  const createPurchaseOrder = (data: {
    vendorId: string;
    orderDate: string;
    expectedDate?: string;
    items: PurchaseOrderItem[];
    shippingFee?: number;
    notes?: string;
    status?: POStatus;
    paidAmount?: number;
    paymentMethod?: string;
  }): PurchaseOrder => {
    const vendor = vendors.find((v) => v.id === data.vendorId);
    const vendorName = vendor ? vendor.name : 'Unknown Supplier';
    const subtotal = data.items.reduce((sum, item) => sum + item.unitCost * item.quantity, 0);
    const taxTotal = data.items.reduce(
      (sum, item) => sum + (item.unitCost * item.quantity * (item.taxRate || 0)) / 100,
      0
    );
    const discountTotal = data.items.reduce((sum, item) => sum + (item.discount || 0), 0);
    const shipping = data.shippingFee || 0;
    const grandTotal = subtotal + taxTotal + shipping - discountTotal;

    const paidAmt = Math.min(data.paidAmount || 0, grandTotal);
    let paymentStatus: PaymentStatus = 'unpaid';
    if (paidAmt >= grandTotal && grandTotal > 0) {
      paymentStatus = 'paid';
    } else if (paidAmt > 0) {
      paymentStatus = 'partial';
    }

    const currentYear = new Date().getFullYear();
    const poNumber = `PUR-${currentYear}-${String(purchaseOrders.length + 84).padStart(4, '0')}`;
    const nowIso = new Date().toISOString();
    const status: POStatus = data.status || 'received';

    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber,
      vendorId: data.vendorId,
      vendorName,
      orderDate: data.orderDate,
      expectedDate: data.expectedDate,
      receivedDate: data.orderDate,
      items: data.items.map((it) => ({
        ...it,
        receivedQuantity: it.quantity,
      })),
      subtotal: Number(subtotal.toFixed(2)),
      taxTotal: Number(taxTotal.toFixed(2)),
      discountTotal: Number(discountTotal.toFixed(2)),
      shippingFee: Number(shipping.toFixed(2)),
      grandTotal: Number(grandTotal.toFixed(2)),
      status,
      paymentStatus,
      paidAmount: Number(paidAmt.toFixed(2)),
      paymentMethod: data.paymentMethod,
      notes: data.notes,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setPurchaseOrders((prev) => [newPO, ...prev]);

    // Update vendor balances
    const unpaidBalance = grandTotal - paidAmt;
    if (vendor) {
      updateVendor(vendor.id, {
        totalPurchases: Number((vendor.totalPurchases + grandTotal).toFixed(2)),
        outstandingPayable: Number((vendor.outstandingPayable + unpaidBalance).toFixed(2)),
      });
    }

    // If initial payment is made, log payment
    if (paidAmt > 0) {
      const paymentRec: PaymentRecord = {
        id: `pay-${Date.now()}`,
        transactionType: 'OUTFLOW_PURCHASE',
        referenceType: 'PURCHASE_ORDER',
        referenceId: poNumber,
        partyType: 'vendor',
        partyId: data.vendorId,
        partyName: vendorName,
        amount: paidAmt,
        paymentMethod: (data.paymentMethod as any) || 'Bank Transfer',
        paymentDate: data.orderDate,
        notes: `Direct purchase payment for ${poNumber}`,
        recordedAt: nowIso,
      };
      setPayments((prev) => [paymentRec, ...prev]);
    }

    // Direct Purchase: Immediately increment inventory product quantity and log movement
    const newMovements: StockMovement[] = [];
    setProducts((prevProducts) => {
      const productMap = new Map<string, Product>(prevProducts.map((p) => [p.id, { ...p }]));
      data.items.forEach((item) => {
        const prod = productMap.get(item.productId);
        if (prod) {
          const prevStock = prod.currentStock;
          const newStock = prevStock + item.quantity;
          prod.currentStock = newStock;
          prod.purchasePrice = item.unitCost; // update latest cost
          prod.updatedAt = data.orderDate;

          newMovements.push({
            id: `mov-${Date.now()}-${item.productId}`,
            productId: prod.id,
            productName: prod.name,
            sku: prod.sku,
            type: 'PURCHASE_RECEIPT',
            quantityChange: item.quantity,
            previousStock: prevStock,
            newStock: newStock,
            referenceId: poNumber,
            reason: `Purchase inward from supplier (${vendorName})`,
            unitCost: item.unitCost,
            performedBy: 'Store / Receiving Manager',
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
          });
        }
      });
      return Array.from(productMap.values());
    });

    if (newMovements.length > 0) {
      setStockMovements((prev) => [...newMovements, ...prev]);
    }

    return newPO;
  };

  const receivePurchaseOrder = (poId: string, notes?: string) => {
    const po = purchaseOrders.find((p) => p.id === poId);
    if (!po || po.status === 'received') return;

    const nowIso = new Date().toISOString();
    const today = nowIso.split('T')[0];

    const updatedPO: PurchaseOrder = {
      ...po,
      status: 'received',
      receivedDate: today,
      updatedAt: nowIso,
      notes: notes ? `${po.notes ? po.notes + ' | ' : ''}${notes}` : po.notes,
      items: po.items.map((it) => ({
        ...it,
        receivedQuantity: it.quantity,
      })),
    };

    setPurchaseOrders((prev) => prev.map((p) => (p.id === poId ? updatedPO : p)));

    // Increment inventory stock
    const newMovements: StockMovement[] = [];
    setProducts((prevProducts) => {
      const productMap = new Map<string, Product>(prevProducts.map((p) => [p.id, { ...p }]));
      po.items.forEach((item) => {
        const prod = productMap.get(item.productId);
        if (prod) {
          const prevStock = prod.currentStock;
          const newStock = prevStock + item.quantity;
          prod.currentStock = newStock;
          prod.purchasePrice = item.unitCost;
          prod.updatedAt = today;

          newMovements.push({
            id: `mov-${Date.now()}-${item.productId}`,
            productId: prod.id,
            productName: prod.name,
            sku: prod.sku,
            type: 'PURCHASE_RECEIPT',
            quantityChange: item.quantity,
            previousStock: prevStock,
            newStock: newStock,
            referenceId: po.poNumber,
            reason: `Shipment received from supplier (${po.vendorName})`,
            unitCost: item.unitCost,
            performedBy: 'Warehouse Inward Team',
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
          });
        }
      });
      return Array.from(productMap.values());
    });

    if (newMovements.length > 0) {
      setStockMovements((prev) => [...newMovements, ...prev]);
    }
  };

  const updatePurchaseOrderStatus = (poId: string, status: POStatus) => {
    if (status === 'received') {
      receivePurchaseOrder(poId);
      return;
    }
    setPurchaseOrders((prev) =>
      prev.map((p) => (p.id === poId ? { ...p, status, updatedAt: new Date().toISOString() } : p))
    );
  };

  // Sales Orders & POS
  const createSalesOrder = (data: {
    customerId: string;
    orderDate: string;
    dueDate?: string;
    items: {
      productId: string;
      quantity: number;
      unitPrice: number;
      taxRate: number;
      discount: number;
    }[];
    shippingFee?: number;
    paymentMethod?: 'Cash' | 'Card' | 'Bank Transfer' | 'UPI' | 'Store Credit' | 'Mixed';
    paidAmount?: number;
    notes?: string;
    status?: SalesOrderStatus;
  }): { success: boolean; order?: SalesOrder; error?: string } => {
    const customer = customers.find((c) => c.id === data.customerId);
    const customerName = customer ? customer.name : 'Walk-in Customer';
    const customerPhone = customer ? customer.phone : undefined;

    // Validate and build items with cost price
    const enrichedItems: SalesOrderItem[] = [];
    let subtotal = 0;
    let taxTotal = 0;
    let discountTotal = 0;
    let totalCost = 0;

    for (const itemInput of data.items) {
      const prod = products.find((p) => p.id === itemInput.productId);
      if (!prod) {
        return { success: false, error: `Product not found: ${itemInput.productId}` };
      }

      // Check stock availability if fulfilling
      const orderStatus: SalesOrderStatus = data.status || 'fulfilled';
      if (orderStatus === 'fulfilled' && prod.currentStock < itemInput.quantity) {
        return {
          success: false,
          error: `Insufficient stock for "${prod.name}". Available: ${prod.currentStock} ${prod.unit}, Requested: ${itemInput.quantity}`,
        };
      }

      const lineGross = itemInput.unitPrice * itemInput.quantity;
      const discountVal = (lineGross * (itemInput.discount || 0)) / 100;
      const taxable = lineGross - discountVal;
      const lineTax = (taxable * (itemInput.taxRate || 0)) / 100;
      const lineNet = taxable + lineTax;
      const lineCost = prod.purchasePrice * itemInput.quantity;
      const lineProfit = lineNet - lineCost;

      subtotal += taxable;
      taxTotal += lineTax;
      discountTotal += discountVal;
      totalCost += lineCost;

      enrichedItems.push({
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        unitPrice: itemInput.unitPrice,
        costPrice: prod.purchasePrice,
        quantity: itemInput.quantity,
        taxRate: itemInput.taxRate,
        discount: itemInput.discount,
        total: Number(lineNet.toFixed(2)),
        profit: Number(lineProfit.toFixed(2)),
      });
    }

    const shipping = data.shippingFee || 0;
    const grandTotal = subtotal + taxTotal + shipping;
    const grossProfit = grandTotal - totalCost;

    const paidAmt = Math.min(data.paidAmount ?? grandTotal, grandTotal);
    let paymentStatus: PaymentStatus = 'unpaid';
    if (paidAmt >= grandTotal && grandTotal > 0) {
      paymentStatus = 'paid';
    } else if (paidAmt > 0) {
      paymentStatus = 'partial';
    }

    const currentYear = new Date().getFullYear();
    const invoiceNumber = `INV-${currentYear}-${String(salesOrders.length + 145).padStart(4, '0')}`;
    const nowIso = new Date().toISOString();
    const status: SalesOrderStatus = data.status || 'fulfilled';

    const newSO: SalesOrder = {
      id: `so-${Date.now()}`,
      invoiceNumber,
      customerId: data.customerId,
      customerName,
      customerPhone,
      orderDate: data.orderDate,
      dueDate: data.dueDate || data.orderDate,
      items: enrichedItems,
      subtotal: Number(subtotal.toFixed(2)),
      taxTotal: Number(taxTotal.toFixed(2)),
      discountTotal: Number(discountTotal.toFixed(2)),
      shippingFee: Number(shipping.toFixed(2)),
      grandTotal: Number(grandTotal.toFixed(2)),
      totalCost: Number(totalCost.toFixed(2)),
      grossProfit: Number(grossProfit.toFixed(2)),
      status,
      paymentStatus,
      paidAmount: Number(paidAmt.toFixed(2)),
      paymentMethod: data.paymentMethod || 'Cash',
      notes: data.notes,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setSalesOrders((prev) => [newSO, ...prev]);

    // Update customer balances
    const unpaidDue = grandTotal - paidAmt;
    if (customer) {
      updateCustomer(customer.id, {
        totalSales: Number((customer.totalSales + grandTotal).toFixed(2)),
        outstandingReceivable: Number((customer.outstandingReceivable + unpaidDue).toFixed(2)),
      });
    }

    // Record payment if paid
    if (paidAmt > 0) {
      const paymentRec: PaymentRecord = {
        id: `pay-${Date.now()}`,
        transactionType: 'INFLOW_SALE',
        referenceType: 'SALES_INVOICE',
        referenceId: invoiceNumber,
        partyType: 'customer',
        partyId: data.customerId,
        partyName: customerName,
        amount: paidAmt,
        paymentMethod: (data.paymentMethod as any) || 'Cash',
        paymentDate: data.orderDate,
        notes: `Sales invoice payment ${invoiceNumber}`,
        recordedAt: nowIso,
      };
      setPayments((prev) => [paymentRec, ...prev]);
    }

    // Deduct stock if fulfilled
    if (status === 'fulfilled' || status === 'confirmed') {
      const newMovements: StockMovement[] = [];
      setProducts((prevProducts) => {
        const productMap = new Map<string, Product>(prevProducts.map((p) => [p.id, { ...p }]));
        enrichedItems.forEach((item) => {
          const prod = productMap.get(item.productId);
          if (prod) {
            const prevStock = prod.currentStock;
            const newStock = Math.max(0, prevStock - item.quantity);
            prod.currentStock = newStock;
            prod.updatedAt = data.orderDate;

            newMovements.push({
              id: `mov-${Date.now()}-${item.productId}`,
              productId: prod.id,
              productName: prod.name,
              sku: prod.sku,
              type: 'SALES_FULFILLMENT',
              quantityChange: -item.quantity,
              previousStock: prevStock,
              newStock: newStock,
              referenceId: invoiceNumber,
              reason: `Sales invoice fulfillment to ${customerName}`,
              performedBy: 'Sales POS Counter',
              timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
            });
          }
        });
        return Array.from(productMap.values());
      });

      if (newMovements.length > 0) {
        setStockMovements((prev) => [...newMovements, ...prev]);
      }
    }

    return { success: true, order: newSO };
  };

  const updateSalesOrderStatus = (soId: string, status: SalesOrderStatus) => {
    setSalesOrders((prev) =>
      prev.map((s) => (s.id === soId ? { ...s, status, updatedAt: new Date().toISOString() } : s))
    );
  };

  // Payment Settlements
  const recordCustomerPayment = ({
    customerId,
    amount,
    paymentMethod,
    referenceId,
    referenceNumber,
    notes,
    paymentDate,
  }: {
    customerId: string;
    amount: number;
    paymentMethod: 'Cash' | 'Card' | 'Bank Transfer' | 'UPI' | 'Cheque' | 'Store Credit';
    referenceId?: string;
    referenceNumber?: string;
    notes?: string;
    paymentDate?: string;
  }) => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer || amount <= 0) return;

    const dateStr = paymentDate || new Date().toISOString().split('T')[0];
    const nowIso = new Date().toISOString();

    const paymentRec: PaymentRecord = {
      id: `pay-${Date.now()}`,
      transactionType: 'CUSTOMER_SETTLEMENT',
      referenceType: 'SALES_INVOICE',
      referenceId: referenceId || 'ACC-SETTLE',
      partyType: 'customer',
      partyId: customerId,
      partyName: customer.name,
      amount: Number(amount.toFixed(2)),
      paymentMethod,
      paymentDate: dateStr,
      referenceNumber,
      notes: notes || `Settlement from ${customer.name}`,
      recordedAt: nowIso,
    };

    setPayments((prev) => [paymentRec, ...prev]);

    // Update customer receivable
    const newReceivable = Math.max(0, customer.outstandingReceivable - amount);
    updateCustomer(customerId, { outstandingReceivable: Number(newReceivable.toFixed(2)) });

    // If linked to specific sales invoice, update invoice paidAmount
    if (referenceId) {
      setSalesOrders((prev) =>
        prev.map((so) => {
          if (so.invoiceNumber === referenceId || so.id === referenceId) {
            const newPaid = Math.min(so.grandTotal, so.paidAmount + amount);
            const status: PaymentStatus = newPaid >= so.grandTotal ? 'paid' : 'partial';
            return {
              ...so,
              paidAmount: Number(newPaid.toFixed(2)),
              paymentStatus: status,
              updatedAt: nowIso,
            };
          }
          return so;
        })
      );
    }
  };

  const recordVendorPayment = ({
    vendorId,
    amount,
    paymentMethod,
    referenceId,
    referenceNumber,
    notes,
    paymentDate,
  }: {
    vendorId: string;
    amount: number;
    paymentMethod: 'Cash' | 'Card' | 'Bank Transfer' | 'UPI' | 'Cheque' | 'Store Credit';
    referenceId?: string;
    referenceNumber?: string;
    notes?: string;
    paymentDate?: string;
  }) => {
    const vendor = vendors.find((v) => v.id === vendorId);
    if (!vendor || amount <= 0) return;

    const dateStr = paymentDate || new Date().toISOString().split('T')[0];
    const nowIso = new Date().toISOString();

    const paymentRec: PaymentRecord = {
      id: `pay-${Date.now()}`,
      transactionType: 'VENDOR_SETTLEMENT',
      referenceType: 'PURCHASE_ORDER',
      referenceId: referenceId || 'VEN-PAY',
      partyType: 'vendor',
      partyId: vendorId,
      partyName: vendor.name,
      amount: Number(amount.toFixed(2)),
      paymentMethod,
      paymentDate: dateStr,
      referenceNumber,
      notes: notes || `Supplier payment to ${vendor.name}`,
      recordedAt: nowIso,
    };

    setPayments((prev) => [paymentRec, ...prev]);

    // Update vendor payable
    const newPayable = Math.max(0, vendor.outstandingPayable - amount);
    updateVendor(vendorId, { outstandingPayable: Number(newPayable.toFixed(2)) });

    // If linked to specific PO, update PO paidAmount
    if (referenceId) {
      setPurchaseOrders((prev) =>
        prev.map((po) => {
          if (po.poNumber === referenceId || po.id === referenceId) {
            const newPaid = Math.min(po.grandTotal, po.paidAmount + amount);
            const status: PaymentStatus = newPaid >= po.grandTotal ? 'paid' : 'partial';
            return {
              ...po,
              paidAmount: Number(newPaid.toFixed(2)),
              paymentStatus: status,
              updatedAt: nowIso,
            };
          }
          return po;
        })
      );
    }
  };

  // Delete Individual Transactions
  const deleteSalesOrder = (soId: string, restoreInventory: boolean = true) => {
    const orderToDelete = salesOrders.find((so) => so.id === soId);
    if (!orderToDelete) return;

    // 1. If fulfilled/confirmed and restoreInventory is true, return quantities to stock
    if (restoreInventory && (orderToDelete.status === 'fulfilled' || orderToDelete.status === 'confirmed')) {
      const restoreMovements: StockMovement[] = [];
      setProducts((prevProducts) => {
        const productMap = new Map<string, Product>(prevProducts.map((p) => [p.id, { ...p }]));
        orderToDelete.items.forEach((item) => {
          const prod = productMap.get(item.productId);
          if (prod) {
            const prevStock = prod.currentStock;
            const newStock = prevStock + item.quantity;
            prod.currentStock = newStock;
            prod.updatedAt = new Date().toISOString();

            restoreMovements.push({
              id: `mov-del-${Date.now()}-${item.productId}`,
              productId: prod.id,
              productName: prod.name,
              sku: prod.sku,
              type: 'ADJUSTMENT_ADD',
              quantityChange: item.quantity,
              previousStock: prevStock,
              newStock: newStock,
              referenceId: orderToDelete.invoiceNumber,
              reason: `Stock restored upon deleting invoice ${orderToDelete.invoiceNumber}`,
              performedBy: 'System Audit',
              timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
            });
          }
        });
        return Array.from(productMap.values());
      });

      if (restoreMovements.length > 0) {
        setStockMovements((prev) => [...restoreMovements, ...prev]);
      }
    }

    // 2. Adjust customer balance (totalSales and outstandingReceivable)
    if (orderToDelete.customerId) {
      const customer = customers.find((c) => c.id === orderToDelete.customerId);
      if (customer) {
        const unpaidDue = Math.max(0, orderToDelete.grandTotal - orderToDelete.paidAmount);
        const newTotalSales = Math.max(0, customer.totalSales - orderToDelete.grandTotal);
        const newReceivable = Math.max(0, customer.outstandingReceivable - unpaidDue);
        updateCustomer(customer.id, {
          totalSales: Number(newTotalSales.toFixed(2)),
          outstandingReceivable: Number(newReceivable.toFixed(2)),
        });
      }
    }

    // 3. Remove associated payments
    setPayments((prev) =>
      prev.filter(
        (p) =>
          p.referenceId !== orderToDelete.invoiceNumber &&
          p.referenceId !== orderToDelete.id
      )
    );

    // 4. Remove order
    setSalesOrders((prev) => prev.filter((so) => so.id !== soId));
  };

  const deletePurchaseOrder = (poId: string, revertInventory: boolean = true) => {
    const poToDelete = purchaseOrders.find((po) => po.id === poId);
    if (!poToDelete) return;

    // 1. If received and revertInventory is true, deduct received quantities from stock
    if (revertInventory && poToDelete.status === 'received') {
      const revertMovements: StockMovement[] = [];
      setProducts((prevProducts) => {
        const productMap = new Map<string, Product>(prevProducts.map((p) => [p.id, { ...p }]));
        poToDelete.items.forEach((item) => {
          const prod = productMap.get(item.productId);
          if (prod) {
            const prevStock = prod.currentStock;
            const newStock = Math.max(0, prevStock - item.quantity);
            prod.currentStock = newStock;
            prod.updatedAt = new Date().toISOString();

            revertMovements.push({
              id: `mov-del-po-${Date.now()}-${item.productId}`,
              productId: prod.id,
              productName: prod.name,
              sku: prod.sku,
              type: 'ADJUSTMENT_REDUCE',
              quantityChange: -item.quantity,
              previousStock: prevStock,
              newStock: newStock,
              referenceId: poToDelete.poNumber,
              reason: `Inventory deducted upon deleting received PO ${poToDelete.poNumber}`,
              performedBy: 'System Audit',
              timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
            });
          }
        });
        return Array.from(productMap.values());
      });

      if (revertMovements.length > 0) {
        setStockMovements((prev) => [...revertMovements, ...prev]);
      }
    }

    // 2. Adjust vendor balance
    if (poToDelete.vendorId) {
      const vendor = vendors.find((v) => v.id === poToDelete.vendorId);
      if (vendor) {
        const unpaidDue = Math.max(0, poToDelete.grandTotal - poToDelete.paidAmount);
        const newTotalPurchases = Math.max(0, vendor.totalPurchases - poToDelete.grandTotal);
        const newPayable = Math.max(0, vendor.outstandingPayable - unpaidDue);
        updateVendor(vendor.id, {
          totalPurchases: Number(newTotalPurchases.toFixed(2)),
          outstandingPayable: Number(newPayable.toFixed(2)),
        });
      }
    }

    // 3. Remove associated payments
    setPayments((prev) =>
      prev.filter(
        (p) =>
          p.referenceId !== poToDelete.poNumber &&
          p.referenceId !== poToDelete.id
      )
    );

    // 4. Remove purchase order
    setPurchaseOrders((prev) => prev.filter((po) => po.id !== poId));
  };

  const deletePayment = (paymentId: string) => {
    const payToDelete = payments.find((p) => p.id === paymentId);
    if (!payToDelete) return;

    const isCustomer =
      payToDelete.type === 'CUSTOMER_PAYMENT' ||
      payToDelete.transactionType === 'INFLOW_SALE' ||
      payToDelete.transactionType === 'CUSTOMER_SETTLEMENT' ||
      payToDelete.partyType === 'customer';

    if (isCustomer) {
      // Revert customer outstanding receivable
      const customerId = payToDelete.partyId;
      if (customerId) {
        const customer = customers.find((c) => c.id === customerId);
        if (customer) {
          updateCustomer(customerId, {
            outstandingReceivable: Number((customer.outstandingReceivable + payToDelete.amount).toFixed(2)),
          });
        }
      }
      // If linked to sales invoice, revert paid amount
      if (payToDelete.referenceId) {
        setSalesOrders((prev) =>
          prev.map((so) => {
            if (so.invoiceNumber === payToDelete.referenceId || so.id === payToDelete.referenceId) {
              const newPaid = Math.max(0, so.paidAmount - payToDelete.amount);
              const status: PaymentStatus = newPaid <= 0 ? 'unpaid' : newPaid < so.grandTotal ? 'partial' : 'paid';
              return {
                ...so,
                paidAmount: Number(newPaid.toFixed(2)),
                paymentStatus: status,
                updatedAt: new Date().toISOString(),
              };
            }
            return so;
          })
        );
      }
    } else {
      // Revert vendor outstanding payable
      const vendorId = payToDelete.partyId;
      if (vendorId) {
        const vendor = vendors.find((v) => v.id === vendorId);
        if (vendor) {
          updateVendor(vendorId, {
            outstandingPayable: Number((vendor.outstandingPayable + payToDelete.amount).toFixed(2)),
          });
        }
      }
      // If linked to PO, revert paid amount
      if (payToDelete.referenceId) {
        setPurchaseOrders((prev) =>
          prev.map((po) => {
            if (po.poNumber === payToDelete.referenceId || po.id === payToDelete.referenceId) {
              const newPaid = Math.max(0, po.paidAmount - payToDelete.amount);
              const status: PaymentStatus = newPaid <= 0 ? 'unpaid' : newPaid < po.grandTotal ? 'partial' : 'paid';
              return {
                ...po,
                paidAmount: Number(newPaid.toFixed(2)),
                paymentStatus: status,
                updatedAt: new Date().toISOString(),
              };
            }
            return po;
          })
        );
      }
    }

    // Remove payment
    setPayments((prev) => prev.filter((p) => p.id !== paymentId));
  };

  // User Management & RBAC Methods
  const canAccessTab = (tab: ActiveTab, user?: AppUser | null): boolean => {
    const activeUser = user !== undefined ? user : currentUser;
    if (!activeUser) return false;
    if (activeUser.status === 'inactive') return false;
    if (activeUser.role === 'admin') return true;

    switch (activeUser.role) {
      case 'sales_cashier':
        return ['pos', 'sales', 'customers', 'products', 'dashboard'].includes(tab);
      case 'inventory_manager':
        return ['inventory', 'inventory_movements', 'products', 'categories', 'purchases', 'vendors', 'dashboard'].includes(tab);
      case 'accountant':
        return ['payments', 'sales', 'purchases', 'reports', 'customers', 'vendors', 'dashboard'].includes(tab);
      default:
        return tab === 'dashboard';
    }
  };

  const login = (username: string, passwordOrPin: string): { success: boolean; error?: string } => {
    const cleanUsername = username.trim().toLowerCase();
    const cleanInput = passwordOrPin.trim();

    if (!cleanUsername) {
      return { success: false, error: 'Please enter a username or email.' };
    }

    const user = users.find(
      (u) =>
        u.username.toLowerCase() === cleanUsername ||
        (u.email && u.email.toLowerCase() === cleanUsername)
    );

    if (!user) {
      return { success: false, error: 'User account not found. Please verify your credentials.' };
    }

    if (user.status === 'inactive') {
      return { success: false, error: 'This user account has been deactivated by the Administrator.' };
    }

    const isPasswordMatch = !user.password || user.password === cleanInput;
    const isPinMatch = user.pin && user.pin === cleanInput;

    if (!isPasswordMatch && !isPinMatch) {
      return { success: false, error: 'Incorrect password or PIN. Please try again.' };
    }

    const nowIso = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const updatedUser: AppUser = {
      ...user,
      lastLogin: nowIso,
    };

    setUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
    setCurrentUser(updatedUser);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedUser));

    // Redirect to home tab for this role if current activeTab is inaccessible
    if (!canAccessTab(activeTab, updatedUser)) {
      if (updatedUser.role === 'sales_cashier') {
        setActiveTab('pos');
      } else if (updatedUser.role === 'inventory_manager') {
        setActiveTab('inventory');
      } else if (updatedUser.role === 'accountant') {
        setActiveTab('payments');
      } else {
        setActiveTab('dashboard');
      }
    }

    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  };

  const switchUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target && target.status === 'active') {
      const nowIso = new Date().toISOString().replace('T', ' ').substring(0, 16);
      const updatedUser = { ...target, lastLogin: nowIso };
      setUsers((prev) => prev.map((u) => (u.id === target.id ? updatedUser : u)));
      setCurrentUser(updatedUser);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedUser));
      if (!canAccessTab(activeTab, updatedUser)) {
        setActiveTab(
          updatedUser.role === 'sales_cashier'
            ? 'pos'
            : updatedUser.role === 'inventory_manager'
            ? 'inventory'
            : updatedUser.role === 'accountant'
            ? 'payments'
            : 'dashboard'
        );
      }
    }
  };

  const createUser = (data: Omit<AppUser, 'id' | 'createdAt' | 'lastLogin'>): AppUser => {
    const defaultColors = ['#3E4A3D', '#5B7059', '#C97B5A', '#4A6B6C', '#D99B6A', '#6366F1', '#8B5CF6'];
    const randomColor = defaultColors[Math.floor(Math.random() * defaultColors.length)];
    const newUser: AppUser = {
      ...data,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      lastLogin: 'Never',
      status: data.status || 'active',
      avatarColor: data.avatarColor || randomColor,
    };
    setUsers((prev) => [newUser, ...prev]);
    return newUser;
  };

  const updateUser = (id: string, updates: Partial<AppUser>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u;
        const updated = { ...u, ...updates };
        if (currentUser?.id === id) {
          setCurrentUser(updated);
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updated));
        }
        return updated;
      })
    );
  };

  const deleteUser = (id: string): { success: boolean; error?: string } => {
    if (currentUser?.id === id) {
      return { success: false, error: 'Cannot delete the account you are currently logged in with.' };
    }
    const target = users.find((u) => u.id === id);
    if (target?.role === 'admin') {
      const activeAdmins = users.filter((u) => u.role === 'admin' && u.status === 'active' && u.id !== id);
      if (activeAdmins.length === 0) {
        return { success: false, error: 'Cannot delete the only remaining active Administrator account.' };
      }
    }
    setUsers((prev) => prev.filter((u) => u.id !== id));
    return { success: true };
  };

  const resetUserPassword = (id: string, newPassword?: string, newPin?: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u;
        const updated = {
          ...u,
          ...(newPassword !== undefined ? { password: newPassword } : {}),
          ...(newPin !== undefined ? { pin: newPin } : {}),
        };
        if (currentUser?.id === id) {
          setCurrentUser(updated);
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updated));
        }
        return updated;
      })
    );
  };

  const toggleUserStatus = (id: string) => {
    if (currentUser?.id === id) return; // cannot deactivate self
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u;
        return { ...u, status: u.status === 'active' ? 'inactive' : 'active' };
      })
    );
  };

  // Reset demo data
  const resetToDefaultData = () => {
    localStorage.clear();
    setBusinessProfile(initialBusinessProfile);
    setCategories(initialCategories);
    setProducts(initialProducts);
    setVendors(initialVendors);
    setCustomers(initialCustomers);
    setPurchaseOrders(initialPurchaseOrders);
    setSalesOrders(initialSalesOrders);
    setStockMovements(initialStockMovements);
    setPayments(initialPayments);
    setUsers(initialUsers);
    setCurrentUser(initialUsers[0]);
  };

  // Completely flush / wipe sample data to start fresh for production use
  const clearAllData = (preserveCategories: boolean = true) => {
    setProducts([]);
    setVendors([]);
    setCustomers([]);
    setPurchaseOrders([]);
    setSalesOrders([]);
    setStockMovements([]);
    setPayments([]);
    if (!preserveCategories) {
      setCategories([]);
    }
  };

  const exportData = () => {
    const fullBackup = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      businessProfile,
      categories,
      products,
      vendors,
      customers,
      purchaseOrders,
      salesOrders,
      stockMovements,
      payments,
      users,
    };
    return JSON.stringify(fullBackup, null, 2);
  };

  const importData = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.businessProfile) setBusinessProfile(data.businessProfile);
      if (Array.isArray(data.categories)) setCategories(data.categories);
      if (Array.isArray(data.products)) setProducts(data.products);
      if (Array.isArray(data.vendors)) setVendors(data.vendors);
      if (Array.isArray(data.customers)) setCustomers(data.customers);
      if (Array.isArray(data.purchaseOrders)) setPurchaseOrders(data.purchaseOrders);
      if (Array.isArray(data.salesOrders)) setSalesOrders(data.salesOrders);
      if (Array.isArray(data.stockMovements)) setStockMovements(data.stockMovements);
      if (Array.isArray(data.payments)) setPayments(data.payments);
      if (Array.isArray(data.users) && data.users.length > 0) setUsers(data.users);
      return true;
    } catch (err) {
      console.error('Import error:', err);
      return false;
    }
  };

  const resetToDemoData = () => {
    resetToDefaultData();
  };

  const exportAllDataAsJSON = () => {
    const dataStr = exportData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnistock_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importDataFromJSON = (jsonStr: string): boolean => {
    return importData(jsonStr);
  };

  // Dynamic KPIs and computed metrics
  const metrics = useMemo(() => {
    const totalRevenue = salesOrders.reduce((sum, so) => (so.status !== 'cancelled' ? sum + so.grandTotal : sum), 0);
    const totalPurchasesCost = purchaseOrders.reduce(
      (sum, po) => (po.status !== 'cancelled' ? sum + po.grandTotal : sum),
      0
    );
    const grossProfit = salesOrders.reduce((sum, so) => (so.status !== 'cancelled' ? sum + so.grossProfit : sum), 0);
    const grossMarginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    let inventoryCostValue = 0;
    let inventoryRetailValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    products.forEach((p) => {
      if (p.status === 'active') {
        inventoryCostValue += p.currentStock * p.purchasePrice;
        inventoryRetailValue += p.currentStock * p.sellingPrice;
        if (p.currentStock <= 0) {
          outOfStockCount++;
        } else if (p.currentStock <= p.minReorderLevel) {
          lowStockCount++;
        }
      }
    });

    const totalReceivables = customers.reduce((sum, c) => sum + c.outstandingReceivable, 0);
    const totalPayables = vendors.reduce((sum, v) => sum + v.outstandingPayable, 0);

    const cashInflows = payments
      .filter((p) => p.transactionType === 'INFLOW_SALE' || p.transactionType === 'CUSTOMER_SETTLEMENT')
      .reduce((sum, p) => sum + p.amount, 0);

    const cashOutflows = payments
      .filter((p) => p.transactionType === 'OUTFLOW_PURCHASE' || p.transactionType === 'VENDOR_SETTLEMENT')
      .reduce((sum, p) => sum + p.amount, 0);

    const netCashflow = cashInflows - cashOutflows;

    return {
      totalRevenue,
      totalPurchasesCost,
      grossProfit,
      grossMarginPercent,
      inventoryCostValue,
      inventoryRetailValue,
      totalProductsCount: products.filter((p) => p.status === 'active').length,
      lowStockCount,
      outOfStockCount,
      totalReceivables,
      totalPayables,
      netCashflow,
      recentActivitiesCount: stockMovements.length + payments.length,
    };
  }, [salesOrders, purchaseOrders, products, customers, vendors, payments, stockMovements]);

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        businessProfile,
        updateBusinessProfile,
        products,
        categories,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        addCategory,
        updateCategory,
        deleteCategory,
        vendors,
        addVendor,
        updateVendor,
        deleteVendor,
        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        purchaseOrders,
        createPurchaseOrder,
        receivePurchaseOrder,
        updatePurchaseOrderStatus,
        deletePurchaseOrder,
        salesOrders,
        createSalesOrder,
        updateSalesOrderStatus,
        deleteSalesOrder,
        stockMovements,
        payments,
        deletePayment,
        recordCustomerPayment,
        recordVendorPayment,
        users,
        currentUser,
        login,
        logout,
        switchUser,
        createUser,
        updateUser,
        deleteUser,
        resetUserPassword,
        toggleUserStatus,
        canAccessTab,
        resetToDefaultData,
        resetToDemoData,
        clearAllData,
        exportData,
        exportAllDataAsJSON,
        importData,
        importDataFromJSON,
        metrics,
        activeInvoiceForModal,
        setActiveInvoiceForModal,
        activePOForModal,
        setActivePOForModal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

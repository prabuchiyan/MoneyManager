const fs = require("fs");

const raw = `
01/05/17 : Lunch : $60

02/05/17 : Lunch : $26

03/05/17 : Breakfast : $35

03/05/17 : Lunch : $30

04/05/17 : Lunch : $30

04/05/17 : Transfered Aboo : $1000

04/05/17 : Transfered Naveen : $2003

04/05/17 : Snacks : $30

04/05/17 : Dinner : $30

05/05/17 : Lunch : $100

05/05/17 : Room Rent : $166

05/05/17 : Give back to Sasi : $293

05/05/17 : Credit Card : $10000

05/05/17 : Give it Back Sathiya : $5000

05/05/17 : Dinner : $20

06/05/17 : Lunch : $20

06/05/17 : Handbag : $284

06/05/17 : Spend Room : $35

06/05/17 : Dinner : $2

06/05/17 : Carrot : $10

07/05/17 : Monthly Purchase : $917

07/05/17 : Recharge : $50

07/05/17 : Dinner : $20

08/05/17 : Lunch : $30

08/05/17 : Dinner : $30

08/05/17 : Paytm Added : $600

09/05/17 : Lunch : $20

09/05/17 : Dinner : $25

10/05/17 : RD : $3500

10/05/17 : Bus : $15

10/05/17 : Transfered to Ram : $1000

10/05/17 : Lunch : $30

10/05/17 : Dinner : $25

10/05/17 : Bus Fair : $180

11/05/17 : Bus Fair : $118

11/05/17 : Pizza : $280

12/05/17 : Spend Money With Abi : $1227

13/05/17 : For Painting​ Spend : $180

13/05/17 : For Painting​ Spend : $5250

13/05/17 : Duplicate RC : $50

14/05/17 : Bus Fair : $28

14/05/17 : Dinner : $30

14/05/17 : Bus Fair : $610

15/05/17 : Lunch : $130

15/05/17 : Give it Back Naveen : $100

15/05/17 : Snacks : $30

15/05/17 : Petrol : $200

16/05/17 : Lunch : $70

16/05/17 : Dinner : $25

16/05/17 : Rice 2kg : $80

16/05/17 : Water Bill : $40

17/05/17 : Lunch : $30

17/05/17 : Dinner : $25

18/05/17 : Breakfast : $30

18/05/17 : Lunch : $28

18/05/17 : Dinner : $30

19/05/17 : Breakfast : $30

20/05/17 : Xerox : $38

20/05/17 : Lunch : $15

20/05/17 : Dinner : $60

21/05/17 : For Painting Work : $1000

21/05/17 : Lunch : $20

21/05/17 : For Painting Work : $1000

21/05/17 : Dinner : $20

22/05/17 : For Painting Work : $2000

22/05/17 : Save To SBI : $98

22/05/17 : Lunch : $70

22/05/17 : Room Rent : $689

22/05/17 : Dinner : $20

23/05/17 : Give it Back Naveen : $200

23/05/17 : Lunch : $20

23/05/17 : Snacks : $4

23/05/17 : Dinner : $10

24/05/17 : Lunch : $20

24/05/17 : Add to Paytm : $200

24/05/17 : Dinner : $40

25/05/17 : Dinner : $25

26/05/17 : Lunch : $30

26/05/17 : Snacks : $20

26/05/17 : Dinner : $40

27/05/17 : Water Cane : $30

27/05/17 : Lunch : $20

27/05/17 : Rice : $80

28/05/17 : Room Hit Purchase : $61

28/05/17 : Washing Soap : $19

28/05/17 : Himalaya Scrub : $69

28/05/17 : Body Spary : $220

28/05/17 : Nivea Face Cream : $93

28/05/17 : Dinner : $20

29/05/17  : Lunch : $50

29/05/17 : Snacks : $10

29/05/17 : Screen Card : $120

29/05/17 : Back Cover : $120

29/05/17 : Birthday Cake : $240

29/05/17 : Dinner : $25

30/05/17 : Breakfast : $30

30/05/17 : Lunch : $20

30/05/17 : Dinner : $20

31/05/17 : Breakfast : $25

31/05/17 : Lunch : $35

31/05/17 : Dinner : $30
`;

const categoryMap = {
  // Food
  "Breakfast": 16,
  "Lunch": 16,
  "Dinner": 16,
  "dinner": 16,
  "Dinner​": 16,
  "Dinner Purchase": 16,

  // Snacks
  "Snacks": 41,
  "Snack": 41,
  "Juice": 41,

  // Fruits
  "Grapes": 17,

  // Groceries
  "Sugar, egg, Milk, Carrot": 21,
  "Egg and washing soap": 21,
  "Carrot": 21,
  "Carrots": 21,
  "Carrot & eggs & Banana": 21,
  "Cashew and Try Grapes": 21,

  // Mobile
  "Mobile Back Cover": 29,
  "Recharge": 30,

  // Utilities
  "Electricity Bill": 11,
  "TV Recharge": 7,

  // Savings
  "Rd": 40,
  "RD": 40,

  // Rent
  "Room Rent": 36,

  // Loan
  "Bike EMI": 27,

  // Vehicle
  "Petrol": 3,

  // Money Given
  "Give it Back": 31,
  "Give it back": 31,
  "Give it back Sasi": 31,

  // Entertainment
  "Gift": 20,
  "Treat": 14,
  "Movie Bike Ticket": 43,

  // Vacation
  "Trip Amount": 45,

  // Transport
  "Bus Fair": 43,

  // Abi
  "Spend With ABI": 19,

  // Wallet
  "Add Money": 46,
  "Add Money to Paytm": 46,
  "Add Paytm": 46,

  // Electronics
  "Watch Pin": 12,

  // Water
  "Water Cane": 47,

  // Households
  "Paste, dates & Shampoo": 25,

  // Misc
  "Default": 28
};

let id = 93;

const transactions = raw
  .trim()
  .split("\n")
  .filter(line => line.trim() && !line.trim().startsWith("//"))
  // .map(line => {
  //   const parts = line.split(" : ");

  //   const date = parts[0].trim();
  //   const notes = parts[1].trim();
  //   const amount = Number(parts[2].replace("$", "").trim());

  //   const [dd, mm, yy] = date.split("/");

  //   const formattedDate = `20${yy}-${mm}-${dd}`;

  //   return {
  //     id: id++,
  //     type: "expense",
  //     amount,
  //     category_id: categoryMap[notes] ?? categoryMap.Default,
  //     source_id: 3,
  //     date: formattedDate,
  //     notes,
  //     bill_id: null,
  //     created_at: `${formattedDate} 00:00:00`,
  //     transfer_group_id: null,
  //     direction: null
  //   };
  // });
  .map(line => {
    const match = line.match(/^(\d{2}\/\d{2}\/\d{2})\s*:\s*(.*?)\s*:\s*\$(.+)$/);

    if (!match) {
      console.log("Invalid line:", line);
      return null;
    }

    const [, date, notes, amountStr] = match;

    const [dd, mm, yy] = date.split("/");

    const formattedDate = `20${yy}-${mm}-${dd}`;

    return {
      id: id++,
      type: "expense",
      amount: Number(amountStr.trim()),
      category_id: categoryMap[notes] ?? categoryMap.Default,
      source_id: 3,
      date: formattedDate,
      notes,
      bill_id: null,
      created_at: `${formattedDate} 00:00:00`,
      transfer_group_id: null,
      direction: null
    };
  })
  .filter(Boolean);

const backup = {
  version: 1,
  timestamp: new Date().toISOString(),
  data: {
    transactions,
    "categories": [
      {
        "id": 1,
        "name": "Bank Charges",
        "type": "expense",
        "icon": "bank",
        "color": "#374151",
        "is_active": 1,
        "created_at": "2026-06-23 16:28:34"
      },
      {
        "id": 2,
        "name": "Beauty Care",
        "type": "expense",
        "icon": "cards-heart-outline",
        "color": "#DB2777",
        "is_active": 1,
        "created_at": "2026-06-23 16:28:34"
      },
      {
        "id": 3,
        "name": "Bike / Vehicle",
        "type": "expense",
        "icon": "motorbike",
        "color": "#DC2626",
        "is_active": 1,
        "created_at": "2026-06-23 16:28:34"
      },
      {
        "id": 4,
        "name": "Cashback",
        "type": "income",
        "icon": "cash-plus",
        "color": "#A3E635",
        "is_active": 1,
        "created_at": "2026-06-23 16:28:34"
      },
      {
        "id": 5,
        "name": "Child Birth",
        "type": "expense",
        "icon": "baby-carriage",
        "color": "#22C55E",
        "is_active": 1,
        "created_at": "2026-06-23 16:28:34"
      },
      {
        "id": 6,
        "name": "Clothes",
        "type": "expense",
        "icon": "tshirt-v",
        "color": "#FB923C",
        "is_active": 1,
        "created_at": "2026-06-23 16:28:34"
      },
      {
        "id": 7,
        "name": "DTH",
        "type": "expense",
        "icon": "television-play",
        "color": "#8B5CF6",
        "is_active": 1,
        "created_at": "2026-06-23 16:28:34"
      },
      {
        "id": 8,
        "name": "Diwali",
        "type": "expense",
        "icon": "firework",
        "color": "#DC2626",
        "is_active": 1,
        "created_at": "2026-06-23 16:28:34"
      },
      {
        "id": 9,
        "name": "Donations",
        "type": "expense",
        "icon": "hand-heart",
        "color": "#22C55E",
        "is_active": 1,
        "created_at": "2026-06-23 16:28:34"
      },
      {
        "id": 10,
        "name": "Drinks",
        "type": "expense",
        "icon": "liquor",
        "color": "#EF4444",
        "is_active": 1,
        "created_at": "2026-06-23 16:28:34"
      },
      {
        "id": 11,
        "name": "Electricity",
        "type": "expense",
        "icon": "power-plug",
        "color": "#DC2626",
        "is_active": 1,
        "created_at": "2026-06-23 16:28:34"
      },
      {
        "id": 12,
        "name": "Electronics",
        "type": "expense",
        "icon": "devices",
        "color": "#A78BFA",
        "is_active": 1,
        "created_at": "2026-06-23 16:28:34"
      },
      {
        "id": 13,
        "name": "Eniyan",
        "type": "expense",
        "icon": "human-female-dance",
        "color": "#FBBF24",
        "is_active": 1,
        "created_at": "2026-06-23 16:28:34"
      },
      {
        "id": 14,
        "name": "Entertainment",
        "type": "expense",
        "icon": "movie-open",
        "color": "#7C3AED",
        "is_active": 1,
        "created_at": "2026-06-23 16:28:34"
      },
      {
        "id": 15,
        "name": "Family",
        "type": "expense",
        "icon": "account-group",
        "color": "#F43F5E",
        "is_active": 1,
        "created_at": "2026-06-23 16:28:34"
      },
      {
        "id": 16,
        "name": "Food & Dining",
        "type": "expense",
        "icon": "silverware-fork-knife",
        "color": "#F59E0B",
        "is_active": 1,
        "created_at": "2026-06-23 16:28:34"
      },
      {
        "id": 17,
        "name": "Fruits",
        "type": "expense",
        "icon": "fruit-watermelon",
        "color": "#84CC16",
        "is_active": 1,
        "created_at": "2026-06-23 16:28:34"
      },
      {
        "id": 18,
        "name": "Gas",
        "type": "expense",
        "icon": "gas-cylinder",
        "color": "#DC2626",
        "is_active": 1,
        "created_at": "2026-06-23 16:28:34"
      },
      {
        "id": 19,
        "name": "Gave it to Abi",
        "type": "expense",
        "icon": "bank-transfer-out",
        "color": "#DC2626",
        "is_active": 1,
        "created_at": "2026-06-23 16:28:34"
      },
      {
        "id": 20,
        "name": "Gifts",
        "type": "expense",
        "icon": "gift",
        "color": "#EC4899",
        "is_active": 1,
        "created_at": "2026-06-23 16:28:34"
      },
      {
        "id": 21,
        "name": "Groceries",
        "type": "expense",
        "icon": "cart",
        "color": "#F97316",
        "is_active": 1,
        "created_at": "2026-06-23 16:28:34"
      },
      {
        "id": 22,
        "name": "Guest Visit to Bangalore",
        "type": "expense",
        "icon": "account-group-outline",
        "color": "#6366F1",
        "is_active": 1,
        "created_at": "2026-06-23 16:28:34"
      },
      {
        "id": 23,
        "name": "Home Improvement",
        "type": "expense",
        "icon": "hammer-wrench",
        "color": "#A16207",
        "is_active": 1,
        "created_at": "2026-06-23 16:28:34"
      },
      {
        "id": 24,
        "name": "Hospital / Medicine",
        "type": "expense",
        "icon": "hospital-box-outline",
        "color": "#EF4444",
        "is_active": 1,
        "created_at": "2026-06-23 16:28:34"
      },
      {
        "id": 25,
        "name": "Households",
        "type": "expense",
        "icon": "bus-stop-covered",
        "color": "#14B8A6",
        "is_active": 1,
        "created_at": "2026-06-23 16:28:34"
      },
      {
        "id": 26,
        "name": "Interest",
        "type": "income",
        "icon": "percent",
        "color": "#22C55E",
        "is_active": 1,
        "created_at": "2026-06-23 16:28:34"
      },
      {
        "id": 27,
        "name": "Loan / EMI",
        "type": "expense",
        "icon": "bank-transfer",
        "color": "#B91C1C",
        "is_active": 1,
        "created_at": "2026-06-23 16:28:34"
      },
      {
        "id": 28,
        "name": "Misc",
        "type": "expense",
        "icon": "dots-horizontal",
        "color": "#9CA3AF",
        "is_active": 1,
        "created_at": "2026-06-23 16:28:34"
      },
      {
        "id": 29,
        "name": "Mobile",
        "type": "expense",
        "icon": "cellphone",
        "color": "#0EA5E9",
        "is_active": 1,
        "created_at": "2026-06-23 16:28:34"
      },
      {
        "id": 30,
        "name": "Mobile Recharge",
        "type": "expense",
        "icon": "cellphone",
        "color": "#0EA5E9",
        "is_active": 1,
        "created_at": "2026-06-23 16:28:34"
      },
      {
        "id": 31,
        "name": "Money Given",
        "type": "expense",
        "icon": "arrow-up-bold-circle",
        "color": "#EF4444",
        "is_active": 1,
        "created_at": "2026-06-23 16:28:34"
      },
      {
        "id": 32,
        "name": "Money Received",
        "type": "income",
        "icon": "arrow-down-bold-circle",
        "color": "#10B981",
        "is_active": 1,
        "created_at": "2026-06-23 16:28:34"
      },
      {
        "id": 33,
        "name": "Parents",
        "type": "expense",
        "icon": "account-group",
        "color": "#FB923C",
        "is_active": 1,
        "created_at": "2026-06-23 16:28:34"
      },
      {
        "id": 34,
        "name": "Printing & Stationery",
        "type": "expense",
        "icon": "printer",
        "color": "#6B7280",
        "is_active": 1,
        "created_at": "2026-06-23 16:28:34"
      },
      {
        "id": 35,
        "name": "Relatives",
        "type": "expense",
        "icon": "account-group",
        "color": "#F97316",
        "is_active": 1,
        "created_at": "2026-06-23 16:28:34"
      },
      {
        "id": 36,
        "name": "Rent",
        "type": "expense",
        "icon": "home-account",
        "color": "#3B82F6",
        "is_active": 1,
        "created_at": "2026-06-23 16:28:34"
      },
      {
        "id": 37,
        "name": "Salary",
        "type": "income",
        "icon": "cash-multiple",
        "color": "#16A34A",
        "is_active": 1,
        "created_at": "2026-06-23 16:28:34"
      },
      {
        "id": 38,
        "name": "Salon",
        "type": "expense",
        "icon": "content-cut",
        "color": "#334155",
        "is_active": 1,
        "created_at": "2026-06-23 16:28:34"
      },
      {
        "id": 39,
        "name": "Sandals / Shoes",
        "type": "expense",
        "icon": "shoe-sneaker",
        "color": "#DB2777",
        "is_active": 1,
        "created_at": "2026-06-23 16:28:34"
      },
      {
        "id": 40,
        "name": "Savings",
        "type": "expense",
        "icon": "piggy-bank",
        "color": "#059669",
        "is_active": 1,
        "created_at": "2026-06-23 16:28:34"
      },
      {
        "id": 41,
        "name": "Snacks",
        "type": "expense",
        "icon": "food-variant",
        "color": "#FBBF24",
        "is_active": 1,
        "created_at": "2026-06-23 16:28:34"
      },
      {
        "id": 42,
        "name": "Special Occasions",
        "type": "expense",
        "icon": "party-popper",
        "color": "#06B6D4",
        "is_active": 1,
        "created_at": "2026-06-23 16:28:34"
      },
      {
        "id": 43,
        "name": "Transport",
        "type": "expense",
        "icon": "bus",
        "color": "#14B8A6",
        "is_active": 1,
        "created_at": "2026-06-23 16:28:34"
      },
      {
        "id": 44,
        "name": "Utilities",
        "type": "expense",
        "icon": "lightning-bolt",
        "color": "#64748B",
        "is_active": 1,
        "created_at": "2026-06-23 16:28:34"
      },
      {
        "id": 45,
        "name": "Vacation",
        "type": "expense",
        "icon": "earth",
        "color": "#A3E635",
        "is_active": 1,
        "created_at": "2026-06-23 16:28:34"
      },
      {
        "id": 46,
        "name": "Wallet Transfer",
        "type": "expense",
        "icon": "swap-horizontal",
        "color": "#6366F1",
        "is_active": 1,
        "created_at": "2026-06-23 16:28:34"
      },
      {
        "id": 47,
        "name": "Water / Purifier",
        "type": "expense",
        "icon": "cup-water",
        "color": "#64748B",
        "is_active": 1,
        "created_at": "2026-06-23 16:28:34"
      },
      {
        "id": 48,
        "name": "Abinaya Birthday",
        "type": "expense",
        "icon": "cake",
        "color": "#A78BFA",
        "is_active": 1,
        "created_at": "2026-06-24 03:22:34"
      },
      {
        "id": 49,
        "name": "Jewellery",
        "type": "expense",
        "icon": "gold",
        "color": "#FBBF24",
        "is_active": 1,
        "created_at": "2026-06-24 18:20:55"
      }
    ],
    sources: [
      {
        "name": "Axis Bank",
        "type": null,
        "initial_balance": 0,
        "icon": "bank",
        "color": "#DC2626",
        "id": 1
      },
      {
        "name": "Bank of Baroda",
        "type": null,
        "initial_balance": 0,
        "icon": "bank",
        "color": "#6366F1",
        "id": 2
      },
      {
        "name": "Cash",
        "type": null,
        "initial_balance": 0,
        "icon": "cash",
        "color": "#A3E635",
        "id": 3
      },
      {
        "name": "State Bank of India",
        "type": null,
        "initial_balance": 0,
        "icon": "bank",
        "color": "#6366F1",
        "id": 4
      }
    ],
    budgets: [],
    bills: []
  }
};

fs.writeFileSync(
  "2017_05.json",
  JSON.stringify(backup, null, 2),
  "utf8"
);

console.log("2017_05.json created successfully.");
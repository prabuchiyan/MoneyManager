const fs = require("fs");

const raw = `
01/03/17 : Add Money to Paytm : $600

01/03/17 : Breakfast : $30

01/03/17 : Lunch : $30

01/03/17 : Mobile Back Cover : $425

01/03/17 : Paste, dates & Shampoo : $425

01/03/17 : Dinner : $35

02/03/17 : Breakfast : $30

02/03/17 : Dinner : $30

02/03/17 : Sugar, egg, Milk, Carrot : $62

03/03/17 : Breakfast : $30

03/03/17 : Lunch : $30

04/03/17 : Juice : $30

04/03/17 : Snacks : $30

04/03/17 : Give it Back : $40

04/03/17 : Carrot : $10

04/03/17 : dinner : $28

05/03/17 : Breakfast : $40

05/03/17 : Grapes : $30

05/03/17 : Snacks : $20

05/03/17 : Dinner : $13

06/03/17 : Bike EMI : $8951

06/03/17 : Breakfast : $40

06/03/17 : Lunch : $30

06/03/17 : Give it Back : $500

06/03/17 : Snacks : $10

06/03/17 : Give it Back : $8000

06/03/17 : Rd : $3500

06/03/17 : Dinner : $20

06/03/17 : Room Rent : $2000

07/03/17 : Breakfast : $30

07/03/17 : Lunch : $30

07/03/17 : Dinner : $30

08/03/17 : Breakfast : $34

08/03/17 : Dinner : $20

08/03/17 : Watch Pin : $20

09/03/17 : Bus Fair : $268

09/03/17 : Petrol : $300

09/03/17 : Spend With ABI : $466

09/03/17 : Cashew and Try Grapes : $260

09/03/17 : Bus Fair : $268

10/03/17 : Breakfast : $40

10/03/17 : TV Recharge : $260

10/03/17 : Electricity Bill : $313

10/03/17 : Recharge : $106

13/03/17 : Gift : $1150

13/03/17 : Give it back : $100

13/03/17 : Dinner​ : $30

13/03/17 : Carrot : $20

14/03/17 : Give it back Sasi : $2000

14/03/17 : Lunch : $40

15/03/17 : Lunch : $30

15/03/17 : Trip Amount : $2570

15/03/17 : Dinner Purchase : $60

16/03/17 : Lunch : $45

16/03/17 : Dinner : $116

17/03/17 : Lunch : $30

17/03/17 : Juice : $30

17/03/17 : Snack : $15

18/03/17 :  Hair Cut : $100

19/03/17 : Egg and washing soap : $20

20/03/17 : Add Money : $200

21/03/17 : Lunch : $30

21/03/17 : Give it back : $30

21/03/17 : Carrot & eggs & Banana : $68

22/03/17 : Lunch : $30

23/03/17 : Snacks : $10

23/03/17 : Dinner : $30

23/03/17 : Carrots : $15

24/03/17 : Treat : $620

25/03/17 : Lunch : $30

25/03/17 : Movie Bike Ticket : $20

26/03/17 : Dinner : $30

27/03/17 : Breakfast : $24

27/03/17 : Give it Back : $30

27/03/17 : Lunch : $30

27/03/17 : Snacks : $10

27/03/17 : Snacks : $20

27/03/17 : Dinner : $48

28/03/17 : Dinner : $20

28/03/17 : Add Paytm : $200

29/03/17 : Water Cane : $40

29/03/17 : Breakfast : $35

29/03/17 : Lunch : $30

29/03/17 : Snacks : $10

29/03/17 : Dinner : $60

29/03/17 : Carrot : $20

30/03/17 : Give it Back : $100

31/03/17 : Breakfast : $35

31/03/17 : Lunch : $30
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
  .map(line => {
    const parts = line.split(" : ");

    const date = parts[0].trim();
    const notes = parts[1].trim();
    const amount = Number(parts[2].replace("$", "").trim());

    const [dd, mm, yy] = date.split("/");

    const formattedDate = `20${yy}-${mm}-${dd}`;

    return {
      id: id++,
      type: "expense",
      amount,
      category_id: categoryMap[notes] ?? categoryMap.Default,
      source_id: 3,
      date: formattedDate,
      notes,
      bill_id: null,
      created_at: `${formattedDate} 00:00:00`,
      transfer_group_id: null,
      direction: null
    };
  });

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
  "2017_03.json",
  JSON.stringify(backup, null, 2),
  "utf8"
);

console.log("2017_03.json created successfully.");
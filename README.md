restaurant-os/
├── app/
│   ├── page.tsx                    # Homepage
│   ├── menu/page.tsx               # Menu browsing
│   ├── cart/page.tsx               # Cart + checkout
│   ├── track/[orderNumber]/        # Order tracking
│   ├── reservations/page.tsx       # Table reservation
│   ├── workspace/page.tsx          # Workspace booking
│   └── admin/
│       ├── page.tsx                # Admin dashboard
│       ├── orders/page.tsx         # Orders management
│       ├── reservations/page.tsx   # Reservations calendar
│       ├── workspace/page.tsx      # Workspace panel
│       └── menu/page.tsx           # Menu CRUD
├── app/api/
│   ├── menu/                       # GET, POST, PUT, DELETE
│   ├── orders/                     # GET, POST, PATCH
│   ├── reservations/               # GET, POST, PATCH
│   ├── workspace/                  # GET, POST, PATCH
│   ├── deliveries/                 # GET, POST
│   ├── tables/                     # GET, POST
│   ├── payments/verify/            # Paystack webhook
│   └── admin/stats/                # Dashboard stats
├── models/
│   ├── MenuItem.ts
│   ├── Order.ts
│   └── index.ts                    # Table, Reservation, WorkspaceBooking, Delivery
├── lib/
│   ├── db.ts                       # MongoDB connection
│   ├── types.ts                    # All TypeScript types
│   └── notifications.ts            # Termii SMS + templates
├── store/
│   └── cart.ts                     # Zustand cart store
├── hooks/
│   └── useRealtime.ts              # WebSocket + sound alert
└── scripts/
    └── seed.ts                     # Database seeder
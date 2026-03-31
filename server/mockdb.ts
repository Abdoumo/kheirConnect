import bcryptjs from "bcryptjs";

export interface MockUser {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: "admin" | "institution" | "donator";
  createdAt: Date;
}

export interface MockInstitution {
  _id: string;
  userId: string;
  name: string;
  description: string;
  location: string;
  approved: boolean;
  donators: string[];
  pendingDonators: string[];
  rotationIndex: number;
  createdAt: Date;
}

class MockDB {
  private users: Map<string, MockUser> = new Map();
  private institutions: Map<string, MockInstitution> = new Map();
  private idCounter = 0;

  constructor() {
    this.initializeAdminUser();
    this.seedInstitutions();
  }

  private generateId(): string {
    return String(++this.idCounter);
  }

  private initializeAdminUser() {
    const adminId = this.generateId();
    const hashedPassword = bcryptjs.hashSync("Admin@123", 10);
    this.users.set(adminId, {
      _id: adminId,
      name: "Admin",
      email: "admin@khairconnect.com",
      password: hashedPassword,
      role: "admin",
      createdAt: new Date(),
    });
  }

  private seedInstitutions() {
    // Create institutional users
    const institution1UserId = this.generateId();
    const institution2UserId = this.generateId();
    const institution3UserId = this.generateId();

    // Add institutional users
    [
      {
        _id: institution1UserId,
        name: "Hope Foundation",
        email: "contact@hopefoundation.org",
        password: bcryptjs.hashSync("HopePass123", 10),
        role: "institution" as const,
        createdAt: new Date(),
      },
      {
        _id: institution2UserId,
        name: "Community Care Center",
        email: "info@communitycare.org",
        password: bcryptjs.hashSync("CarePass123", 10),
        role: "institution" as const,
        createdAt: new Date(),
      },
      {
        _id: institution3UserId,
        name: "Education for All",
        email: "support@educationforall.org",
        password: bcryptjs.hashSync("EducatePass123", 10),
        role: "institution" as const,
        createdAt: new Date(),
      },
    ].forEach((user) => {
      this.users.set(user._id, user);
    });

    // Add institutions
    const institutions = [
      {
        _id: this.generateId(),
        userId: institution1UserId,
        name: "Hope Foundation",
        description:
          "Providing support and relief to underprivileged communities. We focus on healthcare, education, and emergency relief.",
        location: "Cairo, Egypt",
        approved: true,
        donators: [],
        pendingDonators: [],
        rotationIndex: 0,
        createdAt: new Date(),
      },
      {
        _id: this.generateId(),
        userId: institution2UserId,
        name: "Community Care Center",
        description:
          "A grassroots organization dedicated to community development and social welfare. We organize food drives, health camps, and educational programs.",
        location: "Alexandria, Egypt",
        approved: true,
        donators: [],
        pendingDonators: [],
        rotationIndex: 0,
        createdAt: new Date(),
      },
      {
        _id: this.generateId(),
        userId: institution3UserId,
        name: "Education for All",
        description:
          "Committed to providing quality education to underprivileged children. We provide scholarships, learning materials, and mentorship programs.",
        location: "Giza, Egypt",
        approved: true,
        donators: [],
        pendingDonators: [],
        rotationIndex: 0,
        createdAt: new Date(),
      },
    ];

    institutions.forEach((inst) => {
      this.institutions.set(inst._id, inst);
    });
  }

  // User methods
  async findUserByEmail(email: string): Promise<MockUser | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async createUser(data: {
    name: string;
    email: string;
    password: string;
    role: "admin" | "institution" | "donator";
  }): Promise<MockUser> {
    const existingUser = await this.findUserByEmail(data.email);
    if (existingUser) {
      throw new Error("Email already registered");
    }

    const id = this.generateId();
    const hashedPassword = bcryptjs.hashSync(data.password, 10);
    const user: MockUser = {
      _id: id,
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role,
      createdAt: new Date(),
    };

    this.users.set(id, user);
    return user;
  }

  async comparePassword(
    plainPassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    return bcryptjs.compare(plainPassword, hashedPassword);
  }

  // Institution methods
  async findInstitutionsByUserId(userId: string): Promise<MockInstitution[]> {
    const institutions: MockInstitution[] = [];
    for (const inst of this.institutions.values()) {
      if (inst.userId === userId) {
        institutions.push(inst);
      }
    }
    return institutions;
  }

  async getAllInstitutions(): Promise<MockInstitution[]> {
    return Array.from(this.institutions.values());
  }

  async createInstitution(data: {
    userId: string;
    name: string;
    description: string;
    location: string;
  }): Promise<MockInstitution> {
    const id = this.generateId();
    const institution: MockInstitution = {
      _id: id,
      userId: data.userId,
      name: data.name,
      description: data.description,
      location: data.location,
      approved: false,
      donators: [],
      pendingDonators: [],
      rotationIndex: 0,
      createdAt: new Date(),
    };

    this.institutions.set(id, institution);
    return institution;
  }

  async findInstitutionById(id: string): Promise<MockInstitution | null> {
    return this.institutions.get(id) || null;
  }

  async updateInstitution(
    id: string,
    data: Partial<MockInstitution>
  ): Promise<MockInstitution | null> {
    const institution = this.institutions.get(id);
    if (!institution) return null;

    const updated = { ...institution, ...data };
    this.institutions.set(id, updated);
    return updated;
  }

  async deleteInstitution(id: string): Promise<boolean> {
    const institution = this.institutions.get(id);
    if (!institution) return false;

    // Also delete the associated user
    for (const [userId, user] of this.users.entries()) {
      if (user._id === institution.userId) {
        this.users.delete(userId);
        break;
      }
    }

    this.institutions.delete(id);
    return true;
  }

  async getAllUsers(): Promise<MockUser[]> {
    return Array.from(this.users.values()).map((user) => ({
      ...user,
      password: "***", // Don't expose actual passwords
    }));
  }
}

export const mockDB = new MockDB();

// GET /users/me/dashboard — thống kê học tập + sử dụng AI của user hiện tại
export interface DashboardRecentQuiz {
  sessionId: string;
  quizTitle: string;
  percentage: number;
  completedAt: string;
}

export interface DashboardTopCharacter {
  characterId: string;
  name: string;
  messageCount: number;
  tokenUsed: number;
}

export interface DashboardLearning {
  totalQuizzesAttempted: number;
  averageScorePercentage: number;
  eraDistribution: Record<string, number>;
  recentQuizzes: DashboardRecentQuiz[];
}

export interface DashboardAiUsage {
  currentBalance: number;
  tier: string;
  totalTokensUsed: number;
  promptTokens: number;
  completionTokens: number;
  topCharacters: DashboardTopCharacter[];
}

export interface UserDashboard {
  learning: DashboardLearning;
  aiUsage: DashboardAiUsage;
}

// GET /customer/dashboard — chỉ CUSTOMER; bổ sung hạn gói, tổng tin nhắn AI, lịch sử thanh toán
export interface CustomerDashboard {
  uid: string;
  userName: string;
  email: string;
  currentTier: string;
  currentTokens: number;
  tierExpiresAt: string | null;
  totalQuizzesAttempted: number;
  averageScorePercentage: number;
  eraDistribution: Record<string, number>;
  recentQuizzes: DashboardRecentQuiz[];
  totalAiMessages: number;
  topCharacters: { characterId: string; characterName: string; messageCount: number }[];
  paymentHistory: { orderCode: number; amount: number; tierName: string; status: string; createdAt: string }[];
}

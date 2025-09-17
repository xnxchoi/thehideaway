import { BasePayload } from "payload";

export enum EmailCategory {
  NOTIFICATIONS = "notifications",
  ALERTS = "alerts",
  VALIDATORS = "validators",
  AUTHENTICATORS = "authenticators",
  MISC = "misc"
}

export interface EmailQuotaStatus {
  dailyLimit: number;
  used: number;
  remaining: number;
  resetTime: Date;
  canSend: boolean;
}

export interface EmailRequest {
  category: EmailCategory;
  priority: "high" | "medium" | "low";
  userTriggered: boolean;
  deferrable: boolean;
  alternativeExists: boolean;
}

export class EmailRateLimiter {
  private payload: BasePayload;
  private dailyLimit: number = 300; // Brevo free tier limit
  private quotaKey = "email_quota";

  constructor(payload: BasePayload) {
    this.payload = payload;
  }

  async getQuotaStatus(): Promise<EmailQuotaStatus> {
    const today = new Date().toISOString().split("T")[0];
    if (!today) {
      throw new Error("Failed to get today's date");
    }
    const quotaData = await this.getStoredQuota(today);

    const resetTime = new Date();
    resetTime.setDate(resetTime.getDate() + 1);
    resetTime.setHours(0, 0, 0, 0);

    return {
      dailyLimit: this.dailyLimit,
      used: quotaData.used,
      remaining: Math.max(0, this.dailyLimit - quotaData.used),
      resetTime,
      canSend: quotaData.used < this.dailyLimit
    };
  }

  async canSendEmail(request: EmailRequest): Promise<{
    canSend: boolean;
    reason?: string;
    action: "send" | "defer" | "disable" | "block";
  }> {
    const quota = await this.getQuotaStatus();

    if (quota.canSend) {
      return { canSend: true, action: "send" };
    }

    // Quota exceeded - apply categorization logic
    switch (request.category) {
      case EmailCategory.NOTIFICATIONS:
        return {
          canSend: false,
          reason:
            "Daily quota exceeded. Notification deferred to next quota period.",
          action: "defer"
        };

      case EmailCategory.ALERTS:
        if (request.userTriggered) {
          return {
            canSend: false,
            reason:
              "Daily quota exceeded. Action temporarily disabled until next quota period.",
            action: "disable"
          };
        } else {
          return {
            canSend: false,
            reason:
              "Daily quota exceeded. Alert deferred to next quota period.",
            action: "defer"
          };
        }

      case EmailCategory.VALIDATORS:
        return {
          canSend: false,
          reason:
            "Daily quota exceeded. Validation email deferred to next quota period.",
          action: "defer"
        };

      case EmailCategory.AUTHENTICATORS:
        return {
          canSend: false,
          reason:
            "Daily quota exceeded. Authentication action disabled until next quota period.",
          action: "disable"
        };

      case EmailCategory.MISC:
        if (request.userTriggered && request.alternativeExists) {
          return {
            canSend: false,
            reason:
              "Daily quota exceeded. Action disabled (alternative method available).",
            action: "disable"
          };
        } else {
          return {
            canSend: false,
            reason:
              "Daily quota exceeded. Email deferred to next quota period.",
            action: "defer"
          };
        }

      default:
        return {
          canSend: false,
          reason: "Daily quota exceeded. Email blocked.",
          action: "block"
        };
    }
  }

  async incrementQuota(): Promise<void> {
    const today = new Date().toISOString().split("T")[0];
    if (!today) {
      throw new Error("Failed to get today's date");
    }
    const quotaData = await this.getStoredQuota(today);

    await this.storeQuota(today, {
      ...quotaData,
      used: quotaData.used + 1
    });
  }

  async deferEmail(
    emailData: Record<string, unknown>,
    category: EmailCategory
  ): Promise<void> {
    try {
      // Store in a simple way for now - we'll implement proper deferred processing later
      this.payload.logger.info(
        `Email deferred: ${category} - ${JSON.stringify(emailData)}`
      );
    } catch (error) {
      this.payload.logger.error(`Failed to defer email: ${error}`);
    }
  }

  async processDeferredEmails(): Promise<void> {
    const quota = await this.getQuotaStatus();

    if (!quota.canSend) {
      return;
    }

    try {
      const deferredEmails = await this.payload.find({
        collection: "deferred-emails",
        where: {
          and: [
            { status: { equals: "pending" } },
            { scheduledFor: { less_than_equal: new Date() } }
          ]
        },
        limit: quota.remaining,
        sort: "scheduledFor"
      });

      for (const email of deferredEmails.docs) {
        try {
          const emailData = JSON.parse(email.emailData);
          // Process the deferred email here
          await this.payload.update({
            collection: "deferred-emails",
            id: email.id,
            data: { status: "sent", sentAt: new Date().toISOString() }
          });

          await this.incrementQuota();
          this.payload.logger.info(`Processed deferred email: ${email.id}`);
        } catch (error) {
          await this.payload.update({
            collection: "deferred-emails",
            id: email.id,
            data: {
              status: "failed",
              attempts: email.attempts + 1,
              lastError: (error as Error).message
            }
          });

          this.payload.logger.error(
            `Failed to process deferred email ${email.id}: ${error}`
          );
        }
      }
    } catch (error) {
      this.payload.logger.error(`Error processing deferred emails: ${error}`);
    }
  }

  private async getStoredQuota(
    date: string
  ): Promise<{ used: number; date: string }> {
    try {
      const result = await this.payload.find({
        collection: "email-quota",
        where: { date: { equals: date } },
        limit: 1
      });

      if (result.docs[0]) {
        return result.docs[0];
      }
    } catch (error) {
      this.payload.logger.error(`Error getting stored quota: ${error}`);
    }

    return { used: 0, date };
  }

  private async storeQuota(
    date: string,
    data: { used: number; date: string }
  ): Promise<void> {
    try {
      const existing = await this.payload.find({
        collection: "email-quota",
        where: { date: { equals: date } },
        limit: 1
      });

      if (existing.docs[0]) {
        await this.payload.update({
          collection: "email-quota",
          id: existing.docs[0].id,
          data
        });
      } else {
        await this.payload.create({
          collection: "email-quota",
          data
        });
      }
    } catch (error) {
      this.payload.logger.error(`Error storing quota: ${error}`);
    }
  }

  private getNextQuotaReset(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }
}

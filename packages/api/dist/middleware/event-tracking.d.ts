/**
 * Event Tracking Middleware
 * Automatically tracks common events like API calls, page views, etc.
 * Part of Operator-in-a-Box blueprint
 */
import { Request, Response, NextFunction } from "express";
/**
 * Track API call events
 */
export declare function eventTrackingMiddleware(req: Request, res: Response, next: NextFunction): void;
/**
 * Track page view events (for web UI)
 */
export declare function trackPageView(page: string): (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=event-tracking.d.ts.map
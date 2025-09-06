import time
import threading
from collections import defaultdict
from typing import Tuple

class RateLimiter:
    """
    Simple in-memory rate limiter for API endpoints
    """
    
    def __init__(self, max_requests: int = 10, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = defaultdict(list)
        self.lock = threading.Lock()
    
    def is_allowed(self, identifier: str) -> Tuple[bool, int]:
        """
        Check if request is allowed
        Returns: (is_allowed, remaining_requests)
        """
        with self.lock:
            now = time.time()
            window_start = now - self.window_seconds
            
            # Clean old requests
            self.requests[identifier] = [
                req_time for req_time in self.requests[identifier]
                if req_time > window_start
            ]
            
            # Check if limit exceeded
            if len(self.requests[identifier]) >= self.max_requests:
                return False, 0
            
            # Add current request
            self.requests[identifier].append(now)
            
            remaining = self.max_requests - len(self.requests[identifier])
            return True, remaining
    
    def get_remaining_time(self, identifier: str) -> int:
        """
        Get remaining time until rate limit resets
        """
        with self.lock:
            if not self.requests[identifier]:
                return 0
            
            oldest_request = min(self.requests[identifier])
            reset_time = oldest_request + self.window_seconds
            remaining = max(0, int(reset_time - time.time()))
            return remaining

class IPRateLimiter:
    """
    Rate limiter specifically for IP addresses
    """
    
    def __init__(self):
        self.rate_limiters = {}
        self.lock = threading.Lock()
    
    def get_limiter(self, ip: str) -> RateLimiter:
        """Get or create rate limiter for IP"""
        with self.lock:
            if ip not in self.rate_limiters:
                self.rate_limiters[ip] = RateLimiter(max_requests=20, window_seconds=60)
            return self.rate_limiters[ip]
    
    def is_allowed(self, ip: str) -> Tuple[bool, int]:
        """Check if IP is allowed to make request"""
        limiter = self.get_limiter(ip)
        return limiter.is_allowed(ip)
    
    def get_remaining_time(self, ip: str) -> int:
        """Get remaining time for IP"""
        limiter = self.get_limiter(ip)
        return limiter.get_remaining_time(ip)

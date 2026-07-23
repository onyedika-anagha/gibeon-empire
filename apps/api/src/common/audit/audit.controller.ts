import { Controller, Get, Query } from "@nestjs/common";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { AuditService } from "./audit.service";
import { Roles } from "../../auth/decorators/roles.decorator";

class AuditQueryDto {
  @IsOptional() @IsString() entity?: string;
  @IsOptional() @IsString() action?: string;
  @IsOptional() @IsString() actor?: string;
  @IsOptional() @IsInt() @Min(1) @Max(500) limit?: number;
}

// Read-only audit trail — admins only (PRD Req. 19, NFR).
@Roles("ADMIN")
@Controller("audit")
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  list(@Query() query: AuditQueryDto) {
    return this.audit.list(query);
  }
}

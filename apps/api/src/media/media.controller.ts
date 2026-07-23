import { Controller, HttpCode, Post } from "@nestjs/common";
import { MediaService } from "./media.service";
import { Roles } from "../auth/decorators/roles.decorator";

// Product imagery is uploaded by catalogue managers only.
@Roles("ADMIN", "STORE_MANAGER")
@Controller("media")
export class MediaController {
  constructor(private readonly media: MediaService) {}

  /** Hand the client a short-lived Cloudinary upload signature. */
  @Post("sign")
  @HttpCode(200)
  sign() {
    return this.media.signUpload();
  }
}

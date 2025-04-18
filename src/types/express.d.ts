import { IUser } from "../models/user.model";

declare global {
  namespace Express {
    interface User extends IUser {} // this merges your fields into passport's User
  }
}

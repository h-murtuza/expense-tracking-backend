import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';
import { ExpenseCategory, ExpenseStatus } from '../../common/enums';

export type ExpenseDocument = HydratedDocument<Expense>;

@Schema({ timestamps: true })
export class Expense extends Document {
  @Prop({ required: true, type: Number })
  amount: number;

  @Prop({
    required: true,
    type: String,
    enum: Object.values(ExpenseCategory),
  })
  category: ExpenseCategory;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, type: Date })
  expenseDate: Date;

  @Prop({
    type: String,
    enum: Object.values(ExpenseStatus),
    default: ExpenseStatus.PENDING,
  })
  status: ExpenseStatus;

  @Prop({ type: String, default: null })
  rejectionReason: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  approvedBy: Types.ObjectId;

  @Prop({ type: Date, default: null })
  approvedAt: Date;
}

export const ExpenseSchema = SchemaFactory.createForClass(Expense);

// Virtual field to populate user data
ExpenseSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

// Ensure virtuals are included in JSON
ExpenseSchema.set('toJSON', { virtuals: true });
ExpenseSchema.set('toObject', { virtuals: true });

// Add indexes for better query performance
ExpenseSchema.index({ userId: 1 });
ExpenseSchema.index({ status: 1 });
ExpenseSchema.index({ category: 1 });
ExpenseSchema.index({ expenseDate: 1 });
ExpenseSchema.index({ createdAt: -1 });

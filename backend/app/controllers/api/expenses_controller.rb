class Api::ExpensesController < ApplicationController
  def index
    expenses = Expense.includes(:category).order(date: :desc, created_at: :desc)

    if params[:year].present? && params[:month].present?
      year = params[:year].to_i
      month = params[:month].to_i

      start_date = Date.new(year, month, 1)
      end_date = start_date.end_of_month

      expenses = expenses.where(date: start_date.beginning_of_day..end_date.end_of_day)
    end

    # Pagination parameters
    limit = (params[:limit] || 10).to_i
    offset = (params[:offset] || 0).to_i
    limit = 10 if limit <= 0  # Prevent invalid limit values
    offset = 0 if offset < 0  # Prevent negative offset

    # Get total count before pagination
    total_count = expenses.count
    current_page = (offset / limit) + 1
    total_pages = (total_count.to_f / limit).ceil

    # Apply pagination
    paginated_expenses = expenses.limit(limit).offset(offset)

    render json: {
      data: paginated_expenses.map { |expense| format_expense(expense) },
      total_count: total_count,
      current_page: current_page,
      total_pages: total_pages
    }
  end

  def create
    expense = Expense.new(expense_params)

    if expense.save
      render json: format_expense(expense), status: :created
    else
      render json: { errors: expense.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    expense = Expense.find(params[:id])

    if expense.update(expense_params)
      render json: format_expense(expense)
    else
      render json: { errors: expense.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    expense = Expense.find(params[:id])
    expense.destroy
    head :no_content
  end

  private

  def expense_params
    params.require(:expense).permit(:description, :amount, :category_id, :date)
  end

  def format_expense(expense)
    {
      id: expense.id,
      description: expense.description,
      amount: expense.amount.to_f,
      category: expense.category.name,
      date: expense.date.to_s,
      created_at: expense.created_at,
      updated_at: expense.updated_at
    }
  end
end

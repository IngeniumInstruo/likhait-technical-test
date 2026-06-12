import React, { useState, useEffect } from "react";
import { getExpenses, createExpense, fetchCategories, createCategory } from "../services/api";
import { Expense, ExpenseFormData, CategoryType } from "../types";
import YearNavigation from "../components/YearNavigation";
import { MonthNavigation } from "../components/MonthNavigation";
import CategoryBreakdown from "../components/CategoryBreakdown";
import { CalendarExpenseTable } from "../components/CalendarExpenseTable";
import { ExpenseForm } from "../components/ExpenseForm";
import { CategoryForm } from "../components/CategoryForm";
import { Modal, Button } from "../vibes";
import { COLORS } from "../constants/colors";

const HistoryPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Get year, month, and page from URL params, default to current date and page 1 if not provided
  const getInitialYearMonthPage = () => {
    const params = new URLSearchParams(window.location.search);
    const currentDate = new Date();
    const yearParam = params.get("year");
    const monthParam = params.get("month");
    const pageParam = params.get("page");

    return {
      year: yearParam ? parseInt(yearParam) : currentDate.getFullYear(),
      month: monthParam ? parseInt(monthParam) : currentDate.getMonth() + 1,
      page: pageParam ? parseInt(pageParam) : 1,
    };
  };

  const initial = getInitialYearMonthPage();
  const [selectedYear, setSelectedYear] = useState(initial.year);
  const [selectedMonth, setSelectedMonth] = useState(initial.month);
  const [currentPage, setCurrentPage] = useState(initial.page);

  // Update URL when year, month, or page changes
  const updateURL = (year: number, month: number, page: number) => {
    const params = new URLSearchParams();
    params.set("year", year.toString());
    params.set("month", month.toString());
    params.set("page", page.toString());
    const newURL = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, "", newURL);
  };

  // Initialize URL params if not present
  useEffect(() => {
    updateURL(selectedYear, selectedMonth, currentPage);
    // Fetch categories on component mount
    fetchAllCategories();
  }, []);

  const fetchAllCategories = async () => {
    try {
      const data = await fetchCategories();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [selectedYear, selectedMonth, currentPage]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const data = await getExpenses(selectedYear, selectedMonth, currentPage);
      setExpenses(data.data);
      setTotalPages(data.total_pages);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setCurrentPage(1);  // Reset to page 1 when changing year
    updateURL(year, selectedMonth, 1);
  };

  const handleMonthChange = (month: number) => {
    setSelectedMonth(month);
    setCurrentPage(1);  // Reset to page 1 when changing month
    updateURL(selectedYear, month, 1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateURL(selectedYear, selectedMonth, page);
  };

  const handleAddExpense = async (data: ExpenseFormData) => {
    try {
      await createExpense(data);
      setIsModalOpen(false);
      fetchExpenses();
    } catch (error) {
      console.error("Error creating expense:", error);
      throw error;
    }
  };

  const handleAddCategory = async (name: string) => {
    try {
      await createCategory(name);
      setIsCategoryModalOpen(false);
      // Refresh categories list
      await fetchAllCategories();
    } catch (error) {
      console.error("Error creating category:", error);
      throw error;
    }
  };

  // Calculate category breakdown
  const categoryData = expenses.reduce(
    (acc, expense) => {
      const category = expense.category || "Uncategorized";
      if (!acc[category]) {
        acc[category] = { category, amount: 0, count: 0 };
      }
      acc[category].amount += Number(expense.amount);
      acc[category].count += 1;
      return acc;
    },
    {} as Record<string, { category: string; amount: number; count: number }>,
  );

  const categoryBreakdown = Object.values(categoryData).sort(
    (a, b) => b.amount - a.amount,
  );
  const total = categoryBreakdown.reduce((sum, cat) => sum + cat.amount, 0);
  const totalCount = categoryBreakdown.reduce((sum, cat) => sum + cat.count, 0);

  const pageStyle: React.CSSProperties = {
    padding: "48px 64px",
    minHeight: "100vh",
    background: COLORS.secondary.s01,
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "24px",
    justifyContent: "space-between",
  };

  const leftHeaderStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "24px",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "40px",
    fontWeight: 700,
    color: COLORS.secondary.s10,
    margin: 0,
    flexShrink: 0,
  };

  const loadingStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "48px",
    fontSize: "18px",
    color: COLORS.secondary.s08,
  };

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div style={leftHeaderStyle}>
          <h1 style={titleStyle}>Expense History</h1>
          <YearNavigation
            currentYear={selectedYear}
            onYearChange={handleYearChange}
          />
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Button variant="secondary" onClick={() => setIsCategoryModalOpen(true)}>
            Add Category
          </Button>
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            Add Expense
          </Button>
        </div>
      </div>

      <MonthNavigation
        currentMonth={selectedMonth}
        currentYear={selectedYear}
        onMonthChange={handleMonthChange}
      />

      <div>
        {loading ? (
          <div style={loadingStyle}>Loading...</div>
        ) : (
          <>
            <CategoryBreakdown
              categories={categoryBreakdown}
              total={total}
              totalCount={totalCount}
            />
            <div style={{ marginTop: "32px" }}>
              <CalendarExpenseTable
                expenses={expenses}
                categories={categories}
                totalPages={totalPages}
                currentPage={currentPage}
                onExpenseUpdated={fetchExpenses}
                onPageChange={handlePageChange}
              />
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Expense"
      >
        <ExpenseForm
          categories={categories}
          onSubmit={handleAddExpense}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Add New Category"
      >
        <CategoryForm
          onSubmit={handleAddCategory}
          onCancel={() => setIsCategoryModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default HistoryPage;

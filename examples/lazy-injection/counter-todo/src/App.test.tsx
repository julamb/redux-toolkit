import { screen, waitFor } from "@testing-library/react"
import App from "./App"
import { renderWithProviders } from "./utils/test-utils"
import userEvent from "@testing-library/user-event"

async function ensureCounterLoaded() {
  await userEvent.click(screen.getByText("Counter example (lazy)"))

  await waitFor(() => expect(screen.queryByTestId("count")).toBeInTheDocument())
}

test("App should have correct initial render", async () => {
  renderWithProviders(<App />)

  // The app should be rendered correctly
  expect(screen.getByText(/learn/i)).toBeInTheDocument()

  await ensureCounterLoaded()

  // Initial state: count should be 0, incrementValue should be 2
  expect(screen.getByTestId("count")).toHaveTextContent("0")
  expect(screen.getByLabelText("Set increment amount")).toHaveValue(2)
})

test("Increment value and Decrement value should work as expected", async () => {
  const { user } = renderWithProviders(<App />)

  await ensureCounterLoaded()

  // Click on "+" => Count should be 1
  await user.click(screen.getByLabelText("Increment value"))
  expect(screen.getByTestId("count")).toHaveTextContent("1")

  // Click on "-" => Count should be 0
  await user.click(screen.getByLabelText("Decrement value"))
  expect(screen.getByTestId("count")).toHaveTextContent("0")
})

test("Add Amount should work as expected", async () => {
  const { user } = renderWithProviders(<App />)

  await ensureCounterLoaded()

  // "Add Amount" button is clicked => Count should be 2
  await user.click(screen.getByText("Add Amount"))
  expect(screen.getByTestId("count")).toHaveTextContent("2")

  const incrementValueInput = screen.getByLabelText("Set increment amount")
  // incrementValue is 2, click on "Add Amount" => Count should be 4
  await user.clear(incrementValueInput)
  await user.type(incrementValueInput, "2")
  await user.click(screen.getByText("Add Amount"))
  expect(screen.getByTestId("count")).toHaveTextContent("4")

  // [Negative number] incrementValue is -1, click on "Add Amount" => Count should be 3
  await user.clear(incrementValueInput)
  await user.type(incrementValueInput, "-1")
  await user.click(screen.getByText("Add Amount"))
  expect(screen.getByTestId("count")).toHaveTextContent("3")
})

it("Add Async should work as expected", async () => {
  const { user } = renderWithProviders(<App />)

  await ensureCounterLoaded()

  // "Add Async" button is clicked => Count should be 2
  await user.click(screen.getByText("Add Async"))

  await waitFor(() =>
    expect(screen.getByTestId("count")).toHaveTextContent("2"),
  )

  const incrementValueInput = screen.getByLabelText("Set increment amount")
  // incrementValue is 2, click on "Add Async" => Count should be 4
  await user.clear(incrementValueInput)
  await user.type(incrementValueInput, "2")

  await user.click(screen.getByText("Add Async"))
  await waitFor(() =>
    expect(screen.getByTestId("count")).toHaveTextContent("4"),
  )

  // [Negative number] incrementValue is -1, click on "Add Async" => Count should be 3
  await user.clear(incrementValueInput)
  await user.type(incrementValueInput, "-1")
  await user.click(screen.getByText("Add Async"))
  await waitFor(() =>
    expect(screen.getByTestId("count")).toHaveTextContent("3"),
  )
})

test("Add If Odd should work as expected", async () => {
  const { user } = renderWithProviders(<App />)

  await ensureCounterLoaded()

  // "Add If Odd" button is clicked => Count should stay 0
  await user.click(screen.getByText("Add If Odd"))
  expect(screen.getByTestId("count")).toHaveTextContent("0")

  // Click on "+" => Count should be updated to 1
  await user.click(screen.getByLabelText("Increment value"))
  expect(screen.getByTestId("count")).toHaveTextContent("1")

  // "Add If Odd" button is clicked => Count should be updated to 3
  await user.click(screen.getByText("Add If Odd"))
  expect(screen.getByTestId("count")).toHaveTextContent("3")

  const incrementValueInput = screen.getByLabelText("Set increment amount")
  // incrementValue is 1, click on "Add If Odd" => Count should be updated to 4
  await user.clear(incrementValueInput)
  await user.type(incrementValueInput, "1")
  await user.click(screen.getByText("Add If Odd"))
  expect(screen.getByTestId("count")).toHaveTextContent("4")

  // click on "Add If Odd" => Count should stay 4
  await user.clear(incrementValueInput)
  await user.type(incrementValueInput, "-1")
  await user.click(screen.getByText("Add If Odd"))
  expect(screen.getByTestId("count")).toHaveTextContent("4")
})

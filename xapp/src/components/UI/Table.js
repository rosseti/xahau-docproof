// components/Table.js
const Table = ({ header, body }) => {
    // const data = [
    //   { id: 1, name: "Alice", age: 28, city: "New York" },
    //   { id: 2, name: "Bob", age: 32, city: "San Francisco" },
    //   { id: 3, name: "Charlie", age: 25, city: "Los Angeles" },
    //   { id: 4, name: "David", age: 30, city: "Chicago" },
    //   { id: 5, name: "Eve", age: 27, city: "Seattle" },
    // ];
  
    return (
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              {header.map((col, index) => (
                <th key={index}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  export default Table;
  
module.exports = {
  create_table: async function(lefts, rights, spaces, cutoff_length) {
    if(lefts.length != rights.length) throw "The left and right columns have differing lengths";
    if(lefts.length == 0) throw "There's nothing in the arrays!";

    // Get the highest length of any entry in the left column
    var max_length = 0;
    for(key in lefts) {
      max_length = lefts[key].length > max_length ? lefts[key].length : max_length;
    }

    // Add trailing spaces to match the highest entry length + spaces parameter
    for(key in lefts) {
      const spaces_to_add = max_length + spaces - lefts[key].length;
      lefts[key] += Array(spaces_to_add + 1).join(" ");
    }

    const dist_from_left = max_length + spaces + 1;
    // Add new lines when an entry in the right column overflows the cutoff_length
    for(key in rights) {
      var new_lines = "";
      const words = String(rights[key]).split(" ");
      // Make sure we don't add spaces if it's the first row
      var add_spaces = false;

      var current_line = "";
      for(i in words) {
        if(current_line.length + words[i].length > cutoff_length) {
          // If we've reached the overflow limit
          if(!add_spaces) {
            add_spaces = true;
          }
          else {
            new_lines += Array(dist_from_left).join(" ");
          }

          // Add current line with linebreak
          new_lines += current_line + "\n";
          // Set the current_line to the word
          current_line = words[i] + " ";
        }
        else {
          // Else add the word to the current line
          current_line += words[i] + " ";
        }
      }
      // Add the trailing line to new_line
      if(current_line.trim() != "") {
        new_lines += (add_spaces ? Array(dist_from_left).join(" ") : "") + current_line + "\n"
      }

      rights[key] = new_lines;
    }

    var output = "";
    for(var i = 0; i < lefts.length; i++) {
      output += lefts[i] + rights[i];
    }
    return "```" + output + "```";
  }
};

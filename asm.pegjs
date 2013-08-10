start = program / ()

statementList = "\n"+ s:statement { return s; }
program = first:statement rest:statementList* { rest.splice(0, 0, first); return rest; }
statement = spaces content:(label / instruction) { return content; }
label = name:name":" { return {'type': 'label', 'name': name}; }
instruction = name:name suffix:suffix?
{
  if (!suffix)
    suffix = [];
  return {'type': 'i', 'name': name, 'ops': suffix };
}
suffix = spaces ops:oplist { return ops; }

oplist = first:op rest:oplist1*
{
  rest.splice(0, 0, first);
  return rest;
}

oplist1 = "," spaces rest:op { return rest; }

op = name / number
nameStart = [a-zA-Z]
nameBody = [a-zA-Z0-9_]
name = ns:nameStart nb:nameBody*
{
  nb.splice(0, 0, ns);
  return nb.join("");
}
number = base16h / base16 / base10
base16h = digits:[0-9a-f]+"h" { return parseInt(digits.join(""), 16); }
base16 = "0x" digits:[0-9a-f]+ { return parseInt(digits.join(""), 16); }
base10 = digits:[0-9]+ { return parseInt(digits.join(""), 10); }

spaces = [ \t]*

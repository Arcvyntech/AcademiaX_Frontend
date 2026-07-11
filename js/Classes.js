// ─────────────────────────────────────────────────────
// AcademiaX ERP
// Classes Module V2
// Website + Mobile Compatible
// ─────────────────────────────────────────────────────

let editingClassId = null;

const CLASS_TONES = [

    "",

    "tone-green",

    "tone-blue"

];

/* =====================================================
LOAD CLASSES
===================================================== */

async function loadClasses(){

    try{

        if(!cache.subjects.length){

            cache.subjects = (

                await api("/subjects")

            ).data;

        }

        const response = await api("/classes");

        cache.classes = response.data || [];

        const countEl = $("c-count");

        if(countEl){

            countEl.textContent =

                cache.classes.length

                ? `${cache.classes.length} Classes`

                : "";

        }

        renderClassesTable();

    }

    catch(error){

        fail(error);

    }

}

/* =====================================================
RENDER TABLE
===================================================== */

function renderClassesTable(){

    const body = $("c-body");

    if(!cache.classes.length){

        body.innerHTML = `

        <tr>

            <td colspan="4"

                class="empty">

                No Classes Found

            </td>

        </tr>

        `;

        return;

    }

    body.innerHTML =

        cache.classes.map(

            (item,index)=>{

                const tone =

                    CLASS_TONES[

                        index %

                        CLASS_TONES.length

                    ];

                return renderClassRow(

                    item,

                    tone

                );

            }

        ).join("");

}
/* =====================================================
RENDER SINGLE CLASS ROW
===================================================== */

function renderClassRow(classData, tone){

    const assignedSubjects =

        (classData.subjectIds || [])

        .map(item => item._id);

    const subjectOptions =

        cache.subjects.length

        ? cache.subjects.map(subject => `

            <label class="subject-chip">

                <input

                    type="checkbox"

                    value="${subject._id}"

                    ${assignedSubjects.includes(subject._id) ? "checked" : ""}

                >

                <i class="ti ti-check chip-check"></i>

                ${esc(subject.name)}

            </label>

        `).join("")

        : `<span class="empty">

            Add subjects first

           </span>`;

    const isEditing =

        editingClassId === classData._id;

    const classDisplay =

        classData.nickname

        ? `${esc(classData.name)} - ${esc(classData.nickname)}`

        : esc(classData.name);

    const classCell = isEditing

        ? `

        <input

            id="edit-cname-${classData._id}"

            value="${esc(classData.name)}"

            placeholder="Class Name"

            style="width:150px"

        >

        <br><br>

        <input

            id="edit-cnick-${classData._id}"

            value="${esc(classData.nickname || "")}"

            placeholder="Section"

            style="width:150px"

        >

        `

        : `

        <div class="name-cell">

            <div class="ic-box ${tone}">

                <i class="ti ti-school"></i>

            </div>

            <div>

                <strong>

                    ${classDisplay}

                </strong>

                ${classData.nickname ? `

                    <br>

                    <small>

                        Section ${esc(classData.nickname)}

                    </small>

                ` : ""}

            </div>

        </div>

        `;

    const actionButtons = isEditing

        ? `

        <button

            class="btn-sm"

            onclick="saveClass('${classData._id}')">

            <i class="ti ti-check"></i>

            Save

        </button>

        <button

            class="btn-sm"

            onclick="cancelClassEdit()">

            <i class="ti ti-x"></i>

            Cancel

        </button>

        `

        : `

        <button

            class="btn-sm"

            onclick="editClass('${classData._id}')">

            <i class="ti ti-edit"></i>

            Edit

        </button>

        <button

            class="btn-sm danger"

            onclick="delClass('${classData._id}')">

            <i class="ti ti-trash"></i>

            Delete

        </button>

        `;

    return `

    <tr>

        <td>

            ${classCell}

        </td>

        <td>

            <span class="count-inline">

                <i class="ti ti-users"></i>

                ${classData.studentCount}

            </span>

        </td>

        <td>

            <div

                class="subject-chips"

                id="cs-${classData._id}">

                ${subjectOptions}

            </div>

            <button

                class="btn-sm primary"

                onclick="saveClassSubjects('${classData._id}')">

                <i class="ti ti-device-floppy"></i>

                Save Subjects

            </button>

        </td>

        <td>

            ${actionButtons}

        </td>

    </tr>

    `;

}
/* =====================================================
ADD CLASS
===================================================== */

$("c-add").onclick = async () => {

    const name = $("c-name").value.trim();

    const nickname = $("c-nick").value.trim();

    if (!name) {

        return fail({

            message: "Class Name is required."

        });

    }

    try {

        await api(

            "/classes",

            "POST",

            {

                name,

                nickname

            }

        );

        $("c-name").value = "";

        $("c-nick").value = "";

        ok("Class Added Successfully.");

        loadClasses();

    }

    catch (error) {

        fail(error);

    }

};

/* =====================================================
DELETE CLASS
===================================================== */

window.delClass = async (id) => {

    try {

        await api(

            "/classes/" + id,

            "DELETE"

        );

        ok("Class Deleted Successfully.");

        loadClasses();

    }

    catch (error) {

        fail(error);

    }

};

/* =====================================================
SAVE SUBJECTS
===================================================== */

window.saveClassSubjects = async (id) => {

    const subjectIds = Array.from(

        document.querySelectorAll(

            `#cs-${id} input:checked`

        )

    ).map(item => item.value);

    try {

        await api(

            "/classes/" + id + "/subjects",

            "PUT",

            {

                subjectIds

            }

        );

        ok("Subjects Updated Successfully.");

        loadClasses();

    }

    catch (error) {

        fail(error);

    }

};

/* =====================================================
EDIT
===================================================== */

window.editClass = (id) => {

    editingClassId = id;

    loadClasses();

};

window.cancelClassEdit = () => {

    editingClassId = null;

    loadClasses();

};

/* =====================================================
SAVE CLASS
===================================================== */

window.saveClass = async (id) => {

    const name =

        $("edit-cname-" + id)

        .value

        .trim();

    const nickname =

        $("edit-cnick-" + id)

        .value

        .trim();

    if (!name) {

        return fail({

            message:

            "Class Name is required."

        });

    }

    try {

        await api(

            "/classes/" + id,

            "PUT",

            {

                name,

                nickname

            }

        );

        editingClassId = null;

        ok(

            "Class Updated Successfully."

        );

        loadClasses();

    }

    catch (error) {

        fail(error);

    }

};

/* =====================================================
INITIAL LOAD
===================================================== */

document.addEventListener(

    "DOMContentLoaded",

    () => {

        loadClasses();

    }

);

/* =====================================================
READY
===================================================== */

console.log("====================================");

console.log("AcademiaX ERP");

console.log("Classes Module");

console.log("Version : 2.0");

console.log("Frontend Ready");

console.log("Website Compatible");

console.log("Mobile Compatible");

console.log("====================================");